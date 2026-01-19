import json
import time
import os
import random
import uuid
import datetime
import chromadb
from chromadb.config import Settings
from services import AIService

class MemorySystem:
    def __init__(self):
        # 1. 向量库 (存经历/对话片段)
        self.chroma = chromadb.PersistentClient(path="./memory_db")
        self.episodic_col = self.chroma.get_or_create_collection("episodes")
        
        # 2. 事实库 (存属性 JSON)
        self.facts_path = "user_facts.json"
        self.facts = self._load_facts()

    def _load_facts(self):
        if os.path.exists(self.facts_path):
            with open(self.facts_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}

    def _save_facts(self):
        with open(self.facts_path, 'w', encoding='utf-8') as f:
            json.dump(self.facts, f, ensure_ascii=False, indent=2)

    def get_fact_context(self):
        """提供给主脑的所有已知信息"""
        facts_str = json.dumps(self.facts, ensure_ascii=False)
        return facts_str
    async def get_longmemory_context(self, user_text: str = None):
        memory_str = "" 
        if user_text:
            query_vec = await AIService.get_embedding(user_text)
            if query_vec:
                results = self.episodic_col.query(
                    query_embeddings=[query_vec],
                    n_results=3
                )
                if results['documents'] and results['documents'][0]:
                    docs = results['documents'][0]
                    metas = results['metadatas'][0]
                    distances = results['distances'][0] 
                    
                    # 构建一个列表来处理排序
                    ranked_memories = []
                    now = datetime.datetime.now()
                    
                    for i, (doc, meta, dist) in enumerate(zip(docs, metas, distances)):
                        # 基础分：将距离转化为相似度分数 (0~1之间)
                        # 距离越小分越高，加1防止除零
                        base_score = 1 / (1 + dist)      
                        # 获取时间并计算天数差
                        date_str = meta.get('date', '1970-01-01')
                        try:
                            mem_date = datetime.datetime.strptime(date_str, "%Y-%m-%d")
                            days_diff = (now - mem_date).days
                        except:
                            days_diff = 9999   
                        time_boost = 1.0
                        if days_diff <= 3:
                            time_boost = 1.2
                        elif days_diff <= 30:
                            time_boost = 1.1
                            
                        final_score = base_score * time_boost
                        
                        ranked_memories.append({
                            "content": doc,
                            "date": date_str,
                            "score": final_score
                        })
                    
                    # 按最终分数重新排序，取前3
                    ranked_memories.sort(key=lambda x: x['score'], reverse=True)
                    top_k = ranked_memories[:3]

                    memory_str += "\n【关联往事】\n"
                    for mem in top_k:
                        print(f"记忆: {mem['content'][:10]}... | 原始分: {base_score:.3f} | 最终分: {mem['score']:.3f}")
                        memory_str += f"- ({mem['date']}) {mem['content']}\n"
  
        else:
       
            total_count = self.episodic_col.count()
            if total_count > 0:
                random_offset = random.randint(0, total_count - 1)
           
                random_result = self.episodic_col.get(
                    limit=1,
                    offset=random_offset
                )
                
                if random_result['documents']:
                    doc = random_result['documents'][0]
              
                    meta = random_result['metadatas'][0] if random_result['metadatas'] else {}
                    date_str = meta.get('date', '久远的回忆')
                    
                    memory_str += f"\n【突然想起】\n- ({date_str}) {doc}\n"
                
        return memory_str



    async def execute_updates(self, update_instruction: dict):
        """
        执行主脑下达的记忆指令
        update_instruction 结构:
        {
            "new_facts": {"key": "value"},  // 更新属性
            "new_episode": "今天发生了..."   // 存入经历
        }
        """
     
        new_facts = update_instruction.get("new_facts")
        if new_facts:
            print(f"🧠 主脑决定更新事实: {new_facts}")
            self.facts.update(new_facts)
            self._save_facts()

  
        new_episode = update_instruction.get("new_episode")
        if new_episode:
            print(f"📅 主脑决定记录经历: {new_episode}")
            vector = await AIService.get_embedding(new_episode)
            if vector:
                self.episodic_col.add(
                    documents=[new_episode],
                    embeddings=[vector],
                    metadatas=[{
                        "timestamp": time.time(),
                        "date": datetime.datetime.now().strftime("%Y-%m-%d")
                    }],
                    ids=[str(uuid.uuid4())]
                )
                print(f"✅ 存入成功! 当前总记忆数: {self.episodic_col.count()}") 
            