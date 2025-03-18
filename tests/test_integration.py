import unittest
from unittest.mock import patch
import sys
import os
import time
import logging

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, socketio, rooms, games, game_states

logger = logging.getLogger(__name__)

class TestGameIntegration(unittest.TestCase):
    def setUp(self):
        """测试前的设置"""
        app.config['TESTING'] = True
        self.clients = []
        # 创建5个客户端
        for _ in range(5):
            self.clients.append(socketio.test_client(app))
        # 清空游戏数据
        rooms.clear()
        games.clear()
        game_states.clear()

    def tearDown(self):
        """测试后的清理"""
        for client in self.clients:
            client.disconnect()
        rooms.clear()
        games.clear()
        game_states.clear()

    def test_full_game_flow(self):
        """测试完整的游戏流程"""
        # 1. 创建游戏
        self.clients[0].emit('create_game')
        response = self.clients[0].get_received()
        self.assertEqual(response[0]['name'], 'game_created')
        game_id = response[0]['args'][0]['game_id']
        
        logger.debug(f"Game created with ID: {game_id}")
        
        # 2. 其他玩家加入游戏
        for i in range(1, 5):
            self.clients[i].emit('join_game', {'game_id': game_id})
            response = self.clients[i].get_received()
            self.assertEqual(response[0]['name'], 'joined_game')
            self.assertEqual(response[0]['args'][0]['game_id'], game_id)
            logger.debug(f"Player {i+1} joined game")

        # 等待所有事件处理完成
        time.sleep(1.0)  # 进一步增加等待时间
        
        logger.debug(f"Current game state: {games.get(game_id)}")
        logger.debug(f"Current room state: {rooms.get(game_id)}")
        logger.debug(f"Game players: {games[game_id].players if game_id in games else 'No game'}")
        
        # 3. 验证所有玩家都收到了角色信息
        for i, client in enumerate(self.clients):
            has_role_info = False
            messages = client.get_received()
            logger.debug(f"Player {i+1} received messages: {messages}")
            for msg in messages:
                if msg['name'] == 'role_info':
                    # 只处理属于该玩家的角色信息
                    if msg['args'][0]['player_number'] == i + 1:
                        has_role_info = True
                        self.assertIn('role', msg['args'][0])
                        self.assertIn('camp', msg['args'][0])
                        logger.debug(f"Player {i+1} received role: {msg['args'][0]['role']}")
                        break  # 找到对应的角色信息后就可以停止查找
            self.assertTrue(has_role_info, f"玩家{i+1}没有收到角色信息")

        # 4. 测试任务流程
        for quest in range(5):  # 5个任务
            # 4.1 队长提议
            leader_index = games[game_id].leader_index
            leader_client = self.clients[leader_index]
            required_players = games[game_id].get_quest_requirement()
            
            # 提议队伍
            team = list(range(1, required_players + 1))  # 选择前N个玩家
            leader_client.emit('propose_team', {
                'game_id': game_id,
                'team': team
            })

            # 4.2 所有玩家投票
            for client in self.clients:
                client.emit('team_vote', {
                    'game_id': game_id,
                    'vote': True  # 所有人同意
                })

            # 4.3 任务执行
            for player_id in team:
                client = self.clients[player_id - 1]
                client.emit('quest_vote', {
                    'game_id': game_id,
                    'vote': True  # 所有人选择任务成功
                })

            # 验证任务结果
            time.sleep(0.1)  # 等待异步处理
            self.assertEqual(len(games[game_id].quest_results), quest + 1)

        # 5. 测试刺客阶段
        assassin_index = next(i for i, (_, role) in enumerate(games[game_id].players) 
                            if role == '刺客')
        merlin_index = next(i for i, (_, role) in enumerate(games[game_id].players) 
                          if role == '梅林')
        
        # 刺客猜测梅林身份
        self.clients[assassin_index].emit('assassinate', {
            'game_id': game_id,
            'target': merlin_index + 1
        })

        # 验证游戏结束
        time.sleep(0.1)  # 等待异步处理
        for client in self.clients:
            messages = client.get_received()
            has_result = False
            for msg in messages:
                if msg['name'] == 'assassination_result':
                    has_result = True
                    self.assertIn('success', msg['args'][0])
                    self.assertIn('message', msg['args'][0])
            self.assertTrue(has_result, "玩家没有收到游戏结束信息")

    def test_invalid_actions(self):
        """测试无效操作"""
        # 1. 创建游戏
        self.clients[0].emit('create_game')
        response = self.clients[0].get_received()
        game_id = response[0]['args'][0]['game_id']

        # 2. 测试加入不存在的游戏
        self.clients[1].emit('join_game', {'game_id': '9999'})
        response = self.clients[1].get_received()
        self.assertEqual(response[0]['name'], 'error')
        self.assertEqual(response[0]['args'][0]['message'], '游戏ID不存在')

        # 3. 测试无效的队伍提议
        self.clients[0].emit('propose_team', {
            'game_id': game_id,
            'team': [1, 2, 3, 4, 5]  # 太多队员
        })
        response = self.clients[0].get_received()
        self.assertEqual(response[0]['name'], 'error')
        self.assertIn('无效', response[0]['args'][0]['message'])

if __name__ == '__main__':
    unittest.main() 