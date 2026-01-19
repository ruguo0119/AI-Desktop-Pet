import asyncio
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

# 1. 强制重载环境变量
load_dotenv(override=True)

async def debug_gemini():
    api_key = os.getenv("LLM_API_KEY")
    base_url = os.getenv("LLM_BASE_URL")
    model = os.getenv("LLM_MODEL")

    print(f"🔍 检查配置:")
    print(f"   URL:   {base_url}")
    print(f"   Key:   {api_key[:8]}******") # 检查 Key 是否读取正确
    print(f"   Model: {model}")

    if not api_key or not base_url:
        print("❌ 错误: 环境变量未读取到！请检查 .env 文件路径")
        return

    client = AsyncOpenAI(api_key=api_key, base_url=base_url)

    print("\n📡 正在发送请求 (请等待)...")
    
    try:
        # 使用最基础的调用，开启 full_response 调试
        response = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Say hello in English."}],
            max_tokens=50
        )
        
        print("\n✅ 请求成功返回！")
        print("------------------------------------------------")
        print(f"完整响应对象: {response}") # 打印整个对象，看里面到底有些啥
        print("------------------------------------------------")
        
        content = response.choices[0].message.content
        if not content:
            print("⚠️ 警告: Content 字段是空的/None！")
            print("可能原因: 模型名称不支持，或者触发了内容过滤")
        else:
            print(f"💬 内容: {content}")

    except Exception as e:
        print(f"\n❌ 请求炸了: {e}")

if __name__ == "__main__":
    asyncio.run(debug_gemini())