import React, { useEffect, useState } from 'react';

const GameInfo = () => {
    const [evilPlayers, setEvilPlayers] = useState([]);
    const [infoMessage, setInfoMessage] = useState('');
    const [myRole, setMyRole] = useState('');
    const [myCamp, setMyCamp] = useState('');

    // 添加日志
    useEffect(() => {
        console.log("GameInfo组件加载，当前角色:", myRole);
        console.log("当前阵营:", myCamp);
        
        socket.on('evil_players_info', (evilPlayers) => {
            console.log("收到evil_players_info事件");
            console.log("接收到的邪恶方信息:", evilPlayers);
            
            if (myRole === '梅林') {
                console.log("当前玩家是梅林，设置邪恶方信息");
                setInfoMessage('你看到的邪恶方玩家:');
            } else if (myCamp === 'evil') {
                console.log("当前玩家是邪恶方，设置同伴信息");
                setInfoMessage('你的邪恶同伴:');
            }
            
            setEvilPlayers(evilPlayers);
            console.log("更新后的evilPlayers状态:", evilPlayers);
        });

        return () => {
            socket.off('evil_players_info');
        };
    }, [myRole, myCamp]);

    // 在渲染部分也添加日志
    console.log("渲染时的evilPlayers:", evilPlayers);
    console.log("渲染时的infoMessage:", infoMessage);

    return (
        <div>
            {evilPlayers.length > 0 && (
                <div className="evil-players-info">
                    <h3>{infoMessage}</h3>
                    <ul>
                        {evilPlayers.map((player, index) => (
                            <li key={index}>
                                {player.name} - {player.role}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default GameInfo; 