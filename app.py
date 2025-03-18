from flask import Flask, render_template, jsonify, request, session
from flask_socketio import SocketIO, emit, join_room, leave_room
from avalon import AvalonGame
import secrets
import random
import logging

# 设置日志级别
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)
# 修改 SocketIO 的初始化配置，允许跨域访问
socketio = SocketIO(app, cors_allowed_origins="*")
games = {}  # 存储游戏实例
game_states = {}  # 存储每个游戏的状态
rooms = {}  # 存储房间信息

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('create_game')
def handle_create_game():
    logger.debug("Handling create_game request")
    room = generate_game_id()
    logger.debug(f"Created room with ID: {room}")
    
    join_room(room)
    
    # 初始化房间数据
    rooms[room] = {
        'players': [],
        'started': False,
        'game_id': room
    }
    logger.debug(f"Rooms after creation: {rooms}")
    
    # 初始化游戏状态
    if room not in game_states:
        logger.debug(f"Initializing game state for room {room}")
        game_states[room] = {
            'connected_players': set(),
            'player_sids': {},
            'team_votes': {},
            'quest_votes': {}
        }
    
    # 添加创建者到玩家列表
    player_number = 0
    rooms[room]['players'].append({
        'sid': request.sid,
        'number': player_number + 1
    })
    
    # 更新游戏状态中的玩家信息
    game_states[room]['connected_players'].add(player_number)
    game_states[room]['player_sids'][player_number] = request.sid
    
    emit('game_created', {
        'game_id': room,
        'player_id': player_number + 1,
        'player_count': 1,
        'connected_players': [1]
    })
    logger.debug(f"Emitted game_created event with game ID: {room}")
    return room

@socketio.on('join_game')
def handle_join_game(data):
    """处理加入游戏的请求"""
    try:
        room = data.get('game_id')
        logger.debug(f"Attempting to join game with ID: {room}")
        logger.debug(f"Request SID: {request.sid}")
        logger.debug(f"Current rooms: {list(rooms.keys())}")
        
        # 检查游戏ID是否存在
        if not room:
            logger.error("Missing game_id in join_game request")
            emit('error', {'message': '游戏ID不能为空'})
            return False
        
        # 确保room是字符串类型
        room = str(room)
        
        # 检查游戏室是否存在
        if room not in rooms:
            logger.debug(f"Room {room} not found")
            logger.debug(f"Available rooms: {list(rooms.keys())}")
            emit('error', {'message': '游戏ID不存在'})
            return False
        
        # 游戏室存在
        logger.debug(f"Found room {room}")
        
        # 检查玩家是否已经在该房间中
        player_sids = []
        if room in game_states and 'player_sids' in game_states[room]:
            player_sids = list(game_states[room]['player_sids'].values())
        
        if request.sid in player_sids:
            logger.debug(f"Player {request.sid} already in room {room}")
            emit('error', {'message': '你已经在该游戏中'})
            return False
        
        # 检查游戏是否已经开始
        if rooms[room]['started']:
            logger.debug(f"Room {room} has already started")
            emit('error', {'message': '游戏已经开始'})
            return False
        
        # 处理加入游戏
        try:
            # 初始化游戏状态
            if room not in game_states:
                logger.debug(f"Initializing game state for room {room}")
                game_states[room] = {
                    'connected_players': set(),
                    'player_sids': {},
                    'team_votes': {},
                    'quest_votes': {}
                }
            
            # 检查房间是否已满
            max_players = 5  # 默认最大玩家数
            if 'players' not in rooms[room]:
                rooms[room]['players'] = []
                
            if len(rooms[room]['players']) >= max_players:
                logger.debug(f"Room {room} is full")
                emit('error', {'message': '游戏房间已满'})
                return False
            
            # 获取当前玩家编号（基于已加入玩家数量）
            player_number = len(rooms[room]['players'])
            logger.debug(f"Assigning player number {player_number + 1} in room {room}")
            
            # 添加新玩家到房间
            rooms[room]['players'].append({
                'sid': request.sid,
                'number': player_number + 1
            })
            
            # 更新游戏状态中的玩家信息
            game_states[room]['connected_players'].add(player_number)
            game_states[room]['player_sids'][player_number] = request.sid
            
            # 现在真正加入Socket.IO房间
            join_room(room)
            logger.debug(f"Successfully joined room: {room}")
            
            logger.debug(f"Added player {player_number + 1} to room {room}")
            logger.debug(f"Current players in room: {[p['number'] for p in rooms[room]['players']]}")
            
            # 先发送加入成功的确认
            emit('joined_game', {
                'game_id': room, 
                'player_id': player_number + 1,
                'player_count': len(rooms[room]['players']),
                'connected_players': [p['number'] for p in rooms[room]['players']]
            })
            logger.debug(f"Emitted joined_game event for room: {room}")
            
            # 广播玩家加入信息
            socketio.emit('player_joined', {
                'player_id': player_number + 1,
                'connected_players': [p['number'] for p in rooms[room]['players']],
                'player_count': len(rooms[room]['players'])
            }, room=room)
            
            # 如果达到5个玩家，开始游戏
            if len(rooms[room]['players']) == 5:
                logger.debug(f"Room {room} has 5 players, starting game")
                start_game(room)
            
            return True
            
        except Exception as e:
            logger.error(f"Error processing join_game: {str(e)}")
            logger.exception("详细错误堆栈")
            emit('error', {'message': f'加入游戏处理失败: {str(e)}'})
            return False
    except Exception as e:
        logger.error(f"Unexpected error in join_game: {str(e)}")
        logger.exception("详细错误堆栈")
        try:
            emit('error', {'message': f'加入游戏失败: {str(e)}'})
        except Exception as emit_error:
            logger.error(f"Failed to emit error: {str(emit_error)}")
        return False

@socketio.on('disconnect')
def handle_disconnect():
    # 获取当前socket的session id
    sid = request.sid
    for game_id in games:
        if game_id in game_states and 'player_sids' not in game_states[game_id]:
            game_states[game_id]['player_sids'] = {}
        
        # 找到断开连接的玩家
        player_sids = game_states[game_id]['player_sids']
        disconnected_player = None
        for player_id, player_sid in player_sids.items():
            if player_sid == sid:
                disconnected_player = player_id
                break
        
        if disconnected_player is not None:
            game_states[game_id]['connected_players'].remove(disconnected_player)
            del game_states[game_id]['player_sids'][disconnected_player]
            socketio.emit('player_left', {
                'player_id': disconnected_player + 1,  # 转换回显示用的编号
                'connected_players': [p + 1 for p in game_states[game_id]['connected_players']]
            }, room=game_id)

def emit_game_state(game_id):
    game = games[game_id]
    socketio.emit('game_state', {
        'current_quest': game.current_quest + 1,
        'quest_results': ['成功' if r else '失败' for r in game.quest_results],
        'required_players': game.get_quest_requirement(),
        'leader': game.leader_index + 1,
        'vote_track': game.vote_track,
        'player_count': game.player_count,
        'camps': {i: game.ROLE_CAMPS[role] for i, (_, role) in enumerate(game.players)}  # 添加所有玩家的阵营信息
    }, room=game_id)

@socketio.on('propose_team')
def handle_propose_team(data):
    game_id = data['game_id']
    team = [int(x) - 1 for x in data['team']]  # 转换为内部索引
    
    if game_id not in games:
        emit('error', {'message': '游戏不存在'})
        return
        
    game = games[game_id]
    if game.propose_team(game.leader_index, team):
        game_states[game_id]['team_votes'] = {}  # 重置投票状态
        socketio.emit('team_proposed', {
            'team': [x + 1 for x in team],
            'player_count': game.player_count
        }, room=game_id)
    else:
        emit('error', {'message': '无效的队伍选择'})

@socketio.on('team_vote')
def handle_team_vote(data):
    game_id = data['game_id']
    vote = data['vote']
    player_id = int(data['player_id']) - 1  # 转换为内部索引
    
    logger.debug(f"收到玩家{player_id+1}的投票: {vote}")
    
    if game_id not in games:
        logger.error(f"游戏ID {game_id} 不存在")
        emit('error', {'message': '游戏不存在'})
        return
        
    game = games[game_id]
    game_states[game_id]['team_votes'][player_id] = vote
    logger.debug(f"当前投票状态: {game_states[game_id]['team_votes']}")
    logger.debug(f"已投票人数: {len(game_states[game_id]['team_votes'])}, 总人数: {game.player_count}")
    
    # 检查是否所有玩家都已投票
    if len(game_states[game_id]['team_votes']) == game.player_count:
        logger.debug("所有玩家已投票，计算结果")
        votes = []
        try:
            votes = [game_states[game_id]['team_votes'][i] 
                    for i in range(game.player_count)]
            logger.debug(f"投票列表: {votes}")
        except Exception as e:
            logger.error(f"生成投票列表时出错: {str(e)}")
            logger.debug(f"当前投票字典: {game_states[game_id]['team_votes']}")
            # 尝试按索引顺序创建投票列表
            votes = []
            for i in range(game.player_count):
                if i in game_states[game_id]['team_votes']:
                    votes.append(game_states[game_id]['team_votes'][i])
                else:
                    logger.error(f"玩家{i+1}的投票数据缺失")
                    # 默认为反对票
                    votes.append(False)
        
        result = game.team_vote(votes)
        logger.debug(f"投票结果: {'通过' if result else '未通过'}")
        logger.debug(f"任务队员: {game.quest_team}")
        
        # 转换为前端所需的格式
        team_votes_for_client = {str(k): v for k, v in game_states[game_id]['team_votes'].items()}
        logger.debug(f"发送给客户端的投票数据: {team_votes_for_client}")
        
        socketio.emit('team_vote_result', {
            'success': result,
            'votes': team_votes_for_client,
            'team': [x + 1 for x in game.quest_team] if result else []  # 如果投票通过，发送队员列表
        }, room=game_id)
        
        # 重置投票状态
        game_states[game_id]['team_votes'] = {}
        logger.debug("投票状态已重置")
        
        # 更新游戏状态
        emit_game_state(game_id)

@socketio.on('quest_vote')
def handle_quest_vote(data):
    game_id = data['game_id']
    vote = data['vote']
    player_id = int(data['player_id']) - 1  # 转换为内部索引
    
    if game_id not in games:
        emit('error', {'message': '游戏不存在'})
        return
        
    game = games[game_id]
    if player_id not in game.quest_team:
        emit('error', {'message': '你不是任务队员'})
        return
        
    game_states[game_id]['quest_votes'][player_id] = vote
    
    # 检查是否所有任务队员都已投票
    if len(game_states[game_id]['quest_votes']) == len(game.quest_team):
        votes = [game_states[game_id]['quest_votes'][i] for i in game.quest_team]
        result = game.quest_vote(votes)
        game_over, message = game.check_game_state()
        
        socketio.emit('quest_vote_result', {
            'success': result,
            'vote_count': {
                'success': sum(1 for v in votes if v),
                'fail': sum(1 for v in votes if not v)
            },
            'game_over': game_over,
            'message': message
        }, room=game_id)
        
        game_states[game_id]['quest_votes'] = {}  # 重置投票状态
        emit_game_state(game_id)

@socketio.on('assassinate')
def handle_assassinate(data):
    game_id = data['game_id']
    target = int(data['target']) - 1
    
    if game_id not in games:
        emit('error', {'message': '游戏不存在'})
        return
        
    game = games[game_id]
    merlin_index = next(i for i, (_, role) in enumerate(game.players) if role == '梅林')
    success = target == merlin_index
    
    emit('assassination_result', {
        'success': success,
        'message': "刺客成功刺杀梅林！邪恶方获胜！" if success else "刺客猜错了！正义方获胜！"
    }, room=game_id)

@socketio.on('validate_game')
def handle_validate_game(data):
    game_id = data.get('game_id', '')
    logger.debug(f"Validating game with ID: {game_id}")
    logger.debug(f"All rooms: {list(rooms.keys())}")
    
    if not game_id:
        logger.error("Empty game_id in validate_game request")
        emit('game_validated', {
            'valid': False,
            'message': '游戏ID不能为空'
        })
        return
    
    # 确保game_id是字符串
    game_id = str(game_id)
    
    if game_id in rooms:  # 使用 rooms 而不是 games 来验证
        logger.debug(f"Found game {game_id}")
        room = rooms[game_id]
        
        # 确保 game_states 中有该游戏的条目
        if game_id not in game_states:
            logger.debug(f"Initializing game_states for game {game_id}")
            game_states[game_id] = {
                'connected_players': set(),
                'player_sids': {}
            }
        
        connected_players = []
        if 'connected_players' in game_states[game_id]:
            connected_players = [p + 1 for p in game_states[game_id]['connected_players']]
            logger.debug(f"Connected players for game {game_id}: {connected_players}")
        
        emit('game_validated', {
            'valid': True,
            'player_count': len(room['players']),  # 使用房间中的玩家数量
            'connected_players': connected_players
        })
        logger.debug(f"Sent game_validated:true for game {game_id}")
    else:
        logger.debug(f"Game {game_id} not found")
        emit('game_validated', {
            'valid': False,
            'message': '游戏ID不存在'
        })
        logger.debug(f"Sent game_validated:false for game {game_id}")

def send_role_info(players, roles):
    print("开始发送角色信息...")
    print(f"当前所有玩家信息: {players}")
    
    for player in players:
        role = player['role']
        print(f"\n处理玩家 {player['name']}, 角色: {role}, sid: {player['sid']}")
        
        if role == '梅林':
            print(f"发现梅林玩家: {player['name']}")
            evil_players = [p for p in players if p['camp'] == 'evil' and p['role'] != '莫德雷德']
            print(f"梅林可见的邪恶方玩家: {evil_players}")
            evil_info = [{
                'name': p['name'],
                'role': p['role']
            } for p in evil_players]
            print(f"准备发送给梅林的信息: {evil_info}")
            socketio.emit('evil_players_info', evil_info, room=player['sid'])
            
        elif player['camp'] == 'evil':
            print(f"发现邪恶方玩家: {player['name']}")
            other_evil_players = [p for p in players if p['camp'] == 'evil' and p['sid'] != player['sid']]
            print(f"该邪恶方可见的其他邪恶方: {other_evil_players}")
            evil_info = [{
                'name': p['name'],
                'role': p['role']
            } for p in other_evil_players]
            print(f"准备发送给邪恶方的信息: {evil_info}")
            socketio.emit('evil_players_info', evil_info, room=player['sid'])

def generate_game_id():
    game_id = str(random.randint(1000, 9999))
    logger.debug(f"Generated new game ID: {game_id}")
    return game_id

# 如果还有其他地方可能生成或使用房间ID，也需要检查
@socketio.on('connect')
def handle_connect():
    logger.debug(f"New client connected: {request.sid}")

# 添加错误处理
@socketio.on_error()
def error_handler(e):
    logger.error(f"SocketIO error: {str(e)}")
    emit('error', {'message': '发生错误，请重试'})

@socketio.on('start_game_manual')
def handle_start_game_manual(data):
    """处理手动开始游戏的请求"""
    game_id = data.get('game_id')
    
    if not game_id:
        emit('error', {'message': '游戏ID不能为空'})
        return False
    
    # 确保game_id是字符串类型
    game_id = str(game_id)
    
    if game_id not in rooms:
        emit('error', {'message': '游戏ID不存在'})
        return False
    
    # 检查游戏是否已经开始
    if rooms[game_id]['started']:
        emit('error', {'message': '游戏已经开始'})
        return False
    
    # 检查玩家数量
    player_count = len(rooms[game_id]['players'])
    if player_count < 5:
        emit('error', {'message': '至少需要5名玩家才能开始游戏'})
        return False
    
    if player_count > 10:
        emit('error', {'message': '最多支持10名玩家'})
        return False
    
    # 开始游戏
    logger.debug(f"Manually starting game in room {game_id} with {player_count} players")
    start_game(game_id)
    return True

def start_game(room):
    """开始游戏"""
    logger.debug(f"Starting game in room {room}")
    rooms[room]['started'] = True
    
    # 获取玩家数量
    player_count = len(rooms[room]['players'])
    
    # 创建游戏实例
    game = AvalonGame(player_count)  # 传入实际玩家数量
    games[room] = game
    game.assign_roles()
    
    logger.debug("Assigning roles to players...")
    # 给每个玩家发送角色信息
    for player in rooms[room]['players']:
        player_index = player['number'] - 1
        player_name, role = game.players[player_index]
        logger.debug(f"Assigning role {role} to player {player['number']}")
        
        role_info = {
            'role': role,
            'camp': game.ROLE_CAMPS[role]
        }
        
        if role == '梅林':
            evil_players = [j for j, (_, r) in enumerate(game.players)
                        if r in ["刺客", "爪牙", "莫甘娜", "莫德雷德"] and r != "莫德雷德"]
            role_info['evil_players'] = [p + 1 for p in evil_players]
            role_info['evil_roles'] = [game.players[p][1] for p in evil_players]
        elif role == '派西维尔':
            # 派西维尔可以看到梅林和莫甘娜，但无法区分
            merlin_morgana = []
            for j, (_, r) in enumerate(game.players):
                if r in ['梅林', '莫甘娜']:
                    merlin_morgana.append(j)
            role_info['merlin_morgana'] = [p + 1 for p in merlin_morgana]
            role_info['merlin_morgana_roles'] = ["梅林或莫甘娜"] * len(merlin_morgana)
        elif role in ["刺客", "爪牙", "莫甘娜", "莫德雷德"]:
            # 邪恶方互相认识，除了奥伯伦
            evil_players = [j for j, (_, r) in enumerate(game.players)
                        if r in ["刺客", "爪牙", "莫甘娜", "莫德雷德"] and j != player_index and r != "奥伯伦"]
            role_info['evil_players'] = [p + 1 for p in evil_players]
            role_info['evil_roles'] = [game.players[p][1] for p in evil_players]
        
        logger.debug(f"Sending role info to player {player['number']}: {role_info}")
        # 在测试环境中使用广播
        if app.config.get('TESTING'):
            socketio.emit('role_info', {
                **role_info,
                'player_number': player['number']
            }, broadcast=True)
        else:
            # 在生产环境中使用房间
            socketio.emit('role_info', role_info, room=player['sid'])
    
    logger.debug("All roles assigned, sending game state...")
    # 发送游戏开始状态
    if app.config.get('TESTING'):
        socketio.emit('game_state', {
            'current_quest': game.current_quest + 1,
            'quest_results': ['成功' if r else '失败' for r in game.quest_results],
            'required_players': game.get_quest_requirement(),
            'leader': game.leader_index + 1,
            'vote_track': game.vote_track,
            'player_count': game.player_count,
            'camps': {i: game.ROLE_CAMPS[role] for i, (_, role) in enumerate(game.players)}
        }, broadcast=True)
    else:
        emit_game_state(room)
    
    # 发送游戏开始事件，通知前端切换界面
    socketio.emit('game_started', {
        'leader': game.leader_index + 1,
        'player_count': game.player_count
    }, room=room)

if __name__ == '__main__':
    # 修改运行配置，允许外部访问
    socketio.run(app, debug=True, host='0.0.0.0', port=5001) 