import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, socketio, rooms

class TestGame(unittest.TestCase):
    def setUp(self):
        """测试前的设置"""
        app.config['TESTING'] = True
        self.client = app.test_client()
        self.socketio_test_client = socketio.test_client(app)
        # 清空房间数据
        rooms.clear()

    def tearDown(self):
        """测试后的清理"""
        rooms.clear()

    def test_create_game(self):
        """测试创建游戏"""
        # 发送创建游戏请求
        self.socketio_test_client.emit('create_game')
        response = self.socketio_test_client.get_received()
        
        # 验证收到游戏创建成功的响应
        self.assertTrue(len(response) > 0)
        self.assertEqual(response[0]['name'], 'game_created')
        
        # 验证房间是否被创建
        room = response[0]['args'][0]['game_id']
        self.assertIn(room, rooms)  # 使用 assertIn 替代 assertTrue
        self.assertFalse(rooms[room]['started'])

    def test_game_id_format(self):
        """测试游戏ID格式"""
        from app import generate_game_id
        
        # 测试生成100个游戏ID
        for _ in range(100):
            game_id = generate_game_id()
            # 验证ID是4位数字的字符串
            self.assertTrue(game_id.isdigit())
            self.assertEqual(len(game_id), 4)
            # 验证ID在1000-9999范围内
            self.assertTrue(1000 <= int(game_id) <= 9999)

    def test_generate_game_id(self):
        """测试游戏ID生成"""
        from app import generate_game_id
        
        game_id = generate_game_id()
        self.assertTrue(isinstance(game_id, str))
        self.assertEqual(len(game_id), 4)

    def test_join_game(self):
        """测试加入游戏"""
        # 先创建一个游戏
        self.socketio_test_client.emit('create_game')
        create_response = self.socketio_test_client.get_received()
        game_id = create_response[0]['args'][0]['game_id']
        
        # 创建新的客户端连接加入游戏
        client2 = socketio.test_client(app)
        client2.emit('join_game', {'game_id': game_id})
        join_response = client2.get_received()
        
        # 验证加入游戏成功
        self.assertTrue(len(join_response) > 0)
        self.assertEqual(join_response[0]['name'], 'joined_game')
        self.assertEqual(join_response[0]['args'][0]['game_id'], game_id)
        
        # 测试加入不存在的游戏
        client3 = socketio.test_client(app)
        client3.emit('join_game', {'game_id': '9999'})
        error_response = client3.get_received()
        
        self.assertEqual(error_response[0]['name'], 'error')
        self.assertEqual(error_response[0]['args'][0]['message'], '游戏ID不存在')

if __name__ == '__main__':
    unittest.main() 