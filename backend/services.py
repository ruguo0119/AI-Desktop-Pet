import base64
import io
from openai import AsyncOpenAI
from config import Config
import json

#  主脑客户端 (Gemini)
client_main = AsyncOpenAI(
    api_key=Config.LLM_API_KEY,
    base_url=Config.LLM_BASE_URL
)

# 意图客户端 (DeepSeek) (暂时废弃)
client_intent = AsyncOpenAI(
    api_key=Config.PROFILE_KEY,
    base_url=Config.PROFILE_BASE
)

# 语音客户端 (SiliconFlow)
client_audio = AsyncOpenAI(
    api_key=Config.SILICON_KEY,
    base_url=Config.SILICON_BASE
)

class AIService:
    @staticmethod
    async def chat_with_neuro_brain(messages: list,image_base64: str = None, timeout=30.0):
        """
        ✅ 核心方法：主脑接口
        一次性完成 [思考 -> 回复 -> 记忆操作]
        """
        try:
            # 强制要求 JSON 模式
            if image_base64:
                # 获取 messages 里的最后一条（用户的新消息），把它改成多模态格式
                last_msg = messages[-1]
                content_text = last_msg["content"]
                
                # 构造带图消息
                new_content = [
                    {"type": "text", "text": content_text},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}"
                        }
                    }
                ]
                # 替换原来的纯文本消息
                messages[-1]["content"] = new_content
            response = await client_main.chat.completions.create(
                model=Config.LLM_MODEL,
                messages=messages,
                temperature=0.7, 
                max_tokens=4096,
                timeout=timeout,
                response_format={"type": "json_object"} 
            )
            content = response.choices[0].message.content
           
            return json.loads(content)
        except Exception as e:
            print(f"❌ 主脑思考失败: {e}")
            # 兜底返回，防止 main.py 崩溃
            return {
                "reply": "（大脑短路中...）",
                "emotion": "dizzy",
                "memory_operation": {},
                "thought": f"API调用出错: {str(e)}"
            }

    @staticmethod
    async def analyze_intent(text: str):
        """
        使用 DeepSeek 快速分析用户意图 (勿扰/普通对话)
        """
        system_prompt = """
        你是一个意图分析器。分析用户的输入，返回 JSON 格式：
        {"action": "silence"} - 如果用户表示忙、别吵、安静。
        {"action": "chat"} - 普通聊天。
        """
        try:
            response = await client_intent.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                response_format={"type": "json_object"} # 强制 JSON
            )
            return response.choices[0].message.content
        except:
            return '{"action": "chat"}'

    @staticmethod
    async def text_to_speech(text: str, emotion: str = "happy"):
        """
        调用 SiliconFlow CosyVoice2 生成语音
        """
       
        prompt_text = f"<{emotion}>{text}" 
        
        try:
            response = await client_audio.audio.speech.create(
                model=Config.TTS_MODEL,
                voice=Config.TTS_VOICE,
                input=prompt_text,
                response_format="mp3" 
            )
            
            # 获取二进制数据
            audio_bytes = response.content
            # 转 Base64 发给前端
            return base64.b64encode(audio_bytes).decode('utf-8')
        except Exception as e:
            print(f"❌ TTS 失败: {e}")
            return None

    @staticmethod
    async def speech_to_text(audio_base64: str):
        
     #   调用 SenseVoice 识别 WebM/WAV 音频
        
        try:
            #  解码 Base64 -> Bytes
            audio_bytes = base64.b64decode(audio_base64)
            
            # 包装成类似文件的对象 (name 属性很重要，要是 .webm)
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = "input.webm" 

            #  发送请求
            transcript = await client_audio.audio.transcriptions.create(
                model=Config.STT_MODEL,
                file=audio_file
            )
            return transcript.text
        except Exception as e:
            print(f"❌ STT 失败: {e}")
            return ""
    @staticmethod
    async def get_embedding(text: str):
        #向量化
        try:
            # 只有确实需要存经历时才调这个
            if not text: return None
            response = await client_audio.embeddings.create(
                model="Qwen/Qwen3-Embedding-8B",
                input=text
            )
            return response.data[0].embedding
        except: return None