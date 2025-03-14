import React from 'react';
import '../styles/RulesGuide.css';

interface RulesGuideProps {
  onClose: () => void;
}

const RulesGuide: React.FC<RulesGuideProps> = ({ onClose }) => {
  return (
    <div className="rules-guide">
      <div className="rules-content">
        <h2>游戏规则说明</h2>
        
        <section className="rule-section">
          <h3>基本规则</h3>
          <ul>
            <li>游戏分为正义阵营和邪恶阵营</li>
            <li>正义阵营需要完成3次任务获胜</li>
            <li>邪恶阵营需要使3次任务失败或者成功刺杀梅林</li>
            <li>每轮由队长选择任务队员</li>
            <li>所有玩家对队伍进行投票</li>
            <li>连续5次队伍提议被否决，邪恶阵营获胜</li>
          </ul>
        </section>

        <section className="rule-section">
          <h3>角色说明</h3>
          <div className="role-cards">
            <div className="role-card good">
              <h4>梅林</h4>
              <p>能看到所有邪恶角色（除莫德雷德外）</p>
            </div>
            <div className="role-card good">
              <h4>派西维尔</h4>
              <p>能看到梅林和莫甘娜（但不知道谁是谁）</p>
            </div>
            <div className="role-card evil">
              <h4>刺客</h4>
              <p>可以在游戏结束时刺杀梅林</p>
            </div>
            <div className="role-card evil">
              <h4>莫甘娜</h4>
              <p>对派西维尔显示为梅林</p>
            </div>
            <div className="role-card evil">
              <h4>莫德雷德</h4>
              <p>对梅林隐身</p>
            </div>
            <div className="role-card evil">
              <h4>奥伯伦</h4>
              <p>对其他邪恶角色隐身</p>
            </div>
          </div>
        </section>

        <section className="rule-section">
          <h3>任务人数要求</h3>
          <table className="mission-table">
            <thead>
              <tr>
                <th>玩家数</th>
                <th>任务1</th>
                <th>任务2</th>
                <th>任务3</th>
                <th>任务4</th>
                <th>任务5</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>5人</td>
                <td>2</td>
                <td>3</td>
                <td>2</td>
                <td>3</td>
                <td>3</td>
              </tr>
              <tr>
                <td>6人</td>
                <td>2</td>
                <td>3</td>
                <td>4</td>
                <td>3</td>
                <td>4</td>
              </tr>
              <tr>
                <td>7人</td>
                <td>2</td>
                <td>3</td>
                <td>3</td>
                <td>4*</td>
                <td>4</td>
              </tr>
            </tbody>
          </table>
          <p className="note">* 标记的任务需要两张失败牌才算失败</p>
        </section>

        <button className="close-button" onClick={onClose}>
          了解规则
        </button>
      </div>
    </div>
  );
};

export default RulesGuide;