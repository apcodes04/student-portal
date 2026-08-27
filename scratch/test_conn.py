import asyncpg
import asyncio

async def test():
    try:
        conn = await asyncpg.connect(
            'postgresql://postgres.kljmfwzinfdyemuvglvw:SuperSecretPass123!@aws-0-ap-south-1.pooler.supabase.com:6543/postgres',
            statement_cache_size=0,
            ssl='require'
        )
        res = await conn.fetch('SELECT count(*) FROM applications;')
        print('CONNECTED SUCCESS:', res)
        await conn.close()
    except Exception as e:
        print("ERROR:", e)

asyncio.run(test())
