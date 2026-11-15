/* 线索侧重读图和位置关系；国家、地标档案沿用原有稳定 ID。 */
window.GM_WORLD_DETECTIVE = {
  intro: '读线索、转地球，在你认为正确的国家上点一下。可以分两步查看提示，也可以从列表提交答案。',
  note: '图上的国界经过简化，小国家或海岸附近不好点时，请用国家列表作答。提示不扣分；直接查看答案不计入找到记录，重新挑战后仍可自己找一遍。',
  missions: [
    {id: 'east-asian-home', answer: 'China', accepts: ['China', 'Taiwan'], title: '从我们的家出发', clue: '它在亚洲东部，东面朝向太平洋。找到我们生活的国家。', hints: ['先找亚洲，再沿大陆东侧的海岸观察。', '它的南部有北回归线经过。'], explanation: '找到了中国！先认大洲、再认海岸，就能缩小寻找范围。', learnPlace: 'China'},
    {id: 'amazon-country', answer: 'Brazil', title: '跟着大河找国家', clue: '亚马孙河流经这里；它占据南美洲很大一片区域，东边临大西洋。', hints: ['转到南美洲，看看大陆东部和中部的大块陆地。', '这个国家的北部有赤道经过，亚马孙河向东流入海洋。'], explanation: '找到了巴西！河流、大洋和赤道，都是帮助定位的线索。继续打开亚马孙河档案看看。', learnPlace: 'wf3'},
    {id: 'reef-neighbour', answer: 'Australia', title: '珊瑚礁旁的大陆', clue: '它位于南半球，大堡礁在它的东北侧海上。', hints: ['先找亚洲东南方向、大洋洲的一大片陆地。', '南回归线经过这里，它四周被海洋环绕。'], explanation: '找到了澳大利亚！大堡礁在它的东北侧，转动地球时也要留意南北方向。', learnPlace: 'wf7'},
    {id: 'nile-mouth', answer: 'Egypt', title: '到大河入海的地方', clue: '尼罗河从这里流入地中海，这个国家位于非洲东北部。', hints: ['找到非洲，再往北找地中海。', '沿尼罗河向北，到海岸附近找这个国家。'], explanation: '找到了埃及！大陆的方位和河流的去向可以一起帮助我们读图。', learnPlace: 'wf2'},
    {id: 'north-american-neighbour', answer: 'Canada', title: '向北寻找邻居', clue: '它在北美洲，大片陆地位于美国本土的北边。', hints: ['先找到美洲，再分清北美洲和南美洲。', '它的北部有许多岛屿，靠近北冰洋。'], explanation: '找到了加拿大！观察邻国和北冰洋，能帮助我们判断它在北美洲的位置。', learnPlace: 'Canada'},
    {id: 'southern-asia', answer: 'India', title: '伸向大洋的陆地', clue: '它在亚洲南部，南部陆地向印度洋伸出。', hints: ['先找到中国，再看它西南方向、喜马拉雅山脉以南。', '它的南方海上有斯里兰卡岛。'], explanation: '找到了印度！山脉、岛屿和海洋一起构成了这次的位置线索。', learnPlace: 'India'},
    {id: 'mediterranean-boot', answer: 'Italy', title: '海上的长靴', clue: '它在欧洲南部，向地中海伸出的半岛看起来像一只长靴。', hints: ['转到欧洲南部，找到非洲北边的地中海。', '观察半岛的轮廓，找找脚尖和靴跟。'], explanation: '找到了意大利！有特点的海岸轮廓，也能成为读图时的小提示。', learnPlace: 'Italy'},
    {id: 'african-south', answer: 'South Africa', title: '到大陆南端会合', clue: '它位于非洲大陆南端，西侧临大西洋，东侧临印度洋。', hints: ['沿非洲大陆一直向南找，别停在旁边的岛屿上。', '它的名字就提示了所在大洲和方向。'], explanation: '找到了南非！大陆南端的位置和两侧的大洋，让这次的目的地很容易辨认。', learnPlace: 'South Africa'}
  ]
};
