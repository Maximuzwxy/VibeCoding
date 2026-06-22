import json
import uuid
from datetime import datetime

DATA_DIR = 'data'
USERS_FILE = f'{DATA_DIR}/users.json'
FRIENDSHIPS_FILE = f'{DATA_DIR}/friendships.json'

users = [
    {
        'id': 'f7a80c84-c4c6-488b-8809-f76e67065fed',
        'username': 'maximuz',
        'password': '111111',
        'avatar': '',
        'bio': '这个人很懒，什么都没写',
        'created_at': '2026-05-10T08:52:53.952023'
    },
    {
        'id': str(uuid.uuid4()),
        'username': 'luna_star',
        'password': '111111',
        'avatar': 'https://api.dicebear.com/9.x/adventurer/svg?seed=luna',
        'bio': '仰望星空的旅人',
        'created_at': '2026-05-09T10:00:00'
    },
    {
        'id': str(uuid.uuid4()),
        'username': 'cloud_walker',
        'password': '111111',
        'avatar': 'https://api.dicebear.com/9.x/adventurer/svg?seed=cloud',
        'bio': '漫步云端，自在如风',
        'created_at': '2026-05-08T14:30:00'
    },
    {
        'id': str(uuid.uuid4()),
        'username': 'pixel_dreamer',
        'password': '111111',
        'avatar': 'https://api.dicebear.com/9.x/adventurer/svg?seed=pixel',
        'bio': '用像素编织梦想',
        'created_at': '2026-05-07T09:15:00'
    },
    {
        'id': str(uuid.uuid4()),
        'username': 'echo_valley',
        'password': '111111',
        'avatar': 'https://api.dicebear.com/9.x/adventurer/svg?seed=echo',
        'bio': '山谷回声，听见世界',
        'created_at': '2026-05-06T16:45:00'
    },
    {
        'id': str(uuid.uuid4()),
        'username': 'neon_pulse',
        'password': '111111',
        'avatar': 'https://api.dicebear.com/9.x/adventurer/svg?seed=neon',
        'bio': '霓虹闪烁，心跳同步',
        'created_at': '2026-05-05T11:20:00'
    },
    {
        'id': str(uuid.uuid4()),
        'username': 'forest_whisper',
        'password': '111111',
        'avatar': 'https://api.dicebear.com/9.x/adventurer/svg?seed=forest',
        'bio': '森林低语，万物生长',
        'created_at': '2026-05-04T08:00:00'
    },
    {
        'id': str(uuid.uuid4()),
        'username': 'ocean_drift',
        'password': '111111',
        'avatar': 'https://api.dicebear.com/9.x/adventurer/svg?seed=ocean',
        'bio': '随波逐流，心向远方',
        'created_at': '2026-05-03T13:10:00'
    },
    {
        'id': str(uuid.uuid4()),
        'username': 'solar_flare',
        'password': '111111',
        'avatar': 'https://api.dicebear.com/9.x/adventurer/svg?seed=solar',
        'bio': '太阳耀斑，能量爆棚',
        'created_at': '2026-05-02T17:30:00'
    },
    {
        'id': str(uuid.uuid4()),
        'username': 'midnight_owl',
        'password': '111111',
        'avatar': 'https://api.dicebear.com/9.x/adventurer/svg?seed=owl',
        'bio': '深夜不眠，思绪万千',
        'created_at': '2026-05-01T22:00:00'
    },
    {
        'id': str(uuid.uuid4()),
        'username': 'crystal_rain',
        'password': '111111',
        'avatar': 'https://api.dicebear.com/9.x/adventurer/svg?seed=crystal',
        'bio': '水晶雨滴，晶莹剔透',
        'created_at': '2026-04-30T07:45:00'
    }
]

friendships = []
for i in range(1, len(users)):
    friendships.append({
        'id': str(uuid.uuid4()),
        'user1': 'maximuz',
        'user2': users[i]['username'],
        'status': 'accepted',
        'created_at': datetime.utcnow().isoformat()
    })

with open(USERS_FILE, 'w', encoding='utf-8') as f:
    json.dump(users, f, ensure_ascii=False, indent=2)

with open(FRIENDSHIPS_FILE, 'w', encoding='utf-8') as f:
    json.dump(friendships, f, ensure_ascii=False, indent=2)

print(f'初始化完成：{len(users)} 个用户，{len(friendships)} 个好友关系')
