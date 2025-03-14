import React from 'react';
import '../styles/RulesGuide.css';

interface RulesGuideProps {
  onClose: () => void;
}

const RulesGuide: React.FC<RulesGuideProps> = ({ onClose }) => {
  return (
    <div className="rules-overlay">
      <div className="rules-content">
        <h2>阿瓦隆游戏规则</h2>
        
        <section>
          <h3>游戏简介</h3>
          <p>阿瓦隆是一个需要5-10名玩家参与的社交推理游戏。玩家分为正义阵营和邪恶阵营，双方为了各自的胜利目标而展开博弈。</p>
        </section>

        <section>
          <h3>角色分配</h3>
          <ul>
            <li>正义阵营：梅林、派西维尔、忠臣</li>
            <li>邪恶阵营：莫德雷德、莫甘娜、奥伯伦、刺客</li>
          </ul>
        </section>

        <section>
          <h3>游戏流程</h3>
          <ol>
            <li>每轮由一名队长选择任务队员</li>
            <li>所有玩家对队伍组成进行投票</li>
            <li>如果队伍获得多数同意，则执行任务</li>
            <li>如果连续5次队伍提议被否决，邪恶阵营获胜</li>
            <li>任务成功需要所有队员投成功票</li>
            <li>任务失败只需一张失败票（第4轮特殊：8-10人游戏需要2张失败票）</li>
          </ol>
        </section>

        <section>
          <h3>胜利条件</h3>
          <ul>
            <li>正义阵营：完成3次任务，并保护梅林不被刺杀</li>
            <li>邪恶阵营：使3次任务失败，或成功刺杀梅林</li>
          </ul>
        </section>

        <section>
          <h3>特殊能力</h3>
          <ul>
            <li>梅林：知道所有邪恶角色（除莫德雷德外）</li>
            <li>派西维尔：能看到梅林和莫甘娜（但不知道谁是谁）</li>
            <li>莫德雷德：对梅林隐身</li>
            <li>莫甘娜：混淆派西维尔的视野</li>
            <li>奥伯伦：对其他邪恶角色隐身，其他邪恶角色也对他隐身</li>
          </ul>
        </section>

        <button className="close-button" onClick={onClose}>
          明白了
        </button>
      </div>
    </div>
  );
};

export default RulesGuide;