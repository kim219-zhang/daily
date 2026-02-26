export interface RecommendationDetail {
  title: string;
  description: string;
}

export interface Recommendation {
  eat: RecommendationDetail;
  wear: RecommendationDetail;
  use: RecommendationDetail;
  action: RecommendationDetail; // New category: Today's Action
}

export type FortuneVibe = 'luxury' | 'calm' | 'energetic' | 'simple' | 'social' | 'wisdom';

export interface FortuneLot {
  id: number;
  title: string;
  description: string;
  vibe: FortuneVibe;
  luckyColor: string;
  luckyNumber: number;
  hexColor: string;
}

export const FORTUNE_LOTS: FortuneLot[] = [
  { id: 1, title: "上上 (Top Fortune)", description: "如日中天，光芒万丈。今日是能量爆发的一天，勇敢去追求你的目标吧。", vibe: 'luxury', luckyColor: "金色", luckyNumber: 8, hexColor: "#C5A059" },
  { id: 2, title: "大吉 (Great Fortune)", description: "万事顺遂，贵人相助。你的努力正在得到回报，保持谦逊与感恩。", vibe: 'luxury', luckyColor: "朱红", luckyNumber: 6, hexColor: "#A65D57" },
  { id: 3, title: "中吉 (Good Fortune)", description: "细水长流，稳中求进。生活节奏恰到好处，适合处理积压已久的事务。", vibe: 'calm', luckyColor: "天蓝", luckyNumber: 3, hexColor: "#8DA9C4" },
  { id: 4, title: "小吉 (Small Fortune)", description: "微风拂面，惬意自得。在细微之处发现美好，今日宜与老友叙旧。", vibe: 'simple', luckyColor: "草绿", luckyNumber: 5, hexColor: "#94A684" },
  { id: 5, title: "吉 (Fortune)", description: "平淡是真，顺其自然。不需要刻意追求，好运往往在不经意间降临。", vibe: 'simple', luckyColor: "米白", luckyNumber: 7, hexColor: "#D6D2C4" },
  { id: 6, title: "平安 (Peace)", description: "岁月静好，现世安稳。今日宜静心养神，远离喧嚣，关注内心世界。", vibe: 'calm', luckyColor: "珍珠灰", luckyNumber: 2, hexColor: "#B4B4B4" },
  { id: 7, title: "喜 (Joy)", description: "喜上眉梢，好事将近。可能会收到令人振奋的消息，分享你的快乐吧。", vibe: 'social', luckyColor: "亮橙", luckyNumber: 9, hexColor: "#D99879" },
  { id: 8, title: "缘 (Fate)", description: "众里寻他，蓦然回首。今日会有奇妙的邂逅，或是与旧识重逢。", vibe: 'social', luckyColor: "藕粉", luckyNumber: 1, hexColor: "#C9ADA7" },
  { id: 9, title: "悟 (Wisdom)", description: "灵光一现，豁然开朗。困扰已久的问题将找到答案，智慧之门已开启。", vibe: 'wisdom', luckyColor: "玄青", luckyNumber: 0, hexColor: "#4A5D5E" },
  { id: 10, title: "闲 (Leisure)", description: "偷得浮生半日闲。放下手中的忙碌，给自己一个彻底放松的机会。", vibe: 'calm', luckyColor: "茶褐", luckyNumber: 4, hexColor: "#8C7867" },
  { id: 11, title: "忙 (Productivity)", description: "天道酬勤，不负韶华。今日是高效产出的一天，你的才华将得到施展。", vibe: 'energetic', luckyColor: "藏蓝", luckyNumber: 11, hexColor: "#546A7B" },
  { id: 12, title: "财 (Wealth)", description: "财源广进，富贵吉祥。可能会有意外的财务收益，理财需谨慎。", vibe: 'luxury', luckyColor: "琥珀", luckyNumber: 88, hexColor: "#B58D3D" },
  { id: 13, title: "健 (Health)", description: "身强体健，元气满满。今日宜流汗运动，唤醒身体的每一个细胞。", vibe: 'energetic', luckyColor: "荧光绿", luckyNumber: 24, hexColor: "#8F9779" },
  { id: 14, title: "慧 (Insight)", description: "洞察秋毫，明辨是非。你的直觉非常敏锐，相信你的第一判断。", vibe: 'wisdom', luckyColor: "墨黑", luckyNumber: 13, hexColor: "#444444" },
  { id: 15, title: "梦 (Dream)", description: "心之所向，素履以往。不要害怕做梦，梦想是引领你前行的灯塔。", vibe: 'wisdom', luckyColor: "薰衣草紫", luckyNumber: 99, hexColor: "#9A8C98" }
];

export const RECOMMENDATION_POOLS: Record<FortuneVibe, Recommendation[]> = {
  luxury: [
    {
      eat: { title: "和牛烧肉或米其林星级料理", description: "高品质的蛋白质能为你提供充沛的动力，犒劳辛勤工作的自己，享受味蕾的极致盛宴。" },
      wear: { title: "剪裁利落的红色系单品", description: "红色象征着力量与自信，利落的剪裁能瞬间提升气场，让你在任何场合都成为焦点。" },
      use: { title: "一支昂贵的钢笔", description: "笔尖划过纸张的质感能让你冷静思考，今日适合签下重要的契约或记录下宏大的愿景。" },
      action: { title: "预订一次高端SPA", description: "让身体在极致的呵护中彻底放松，为接下来的挑战积蓄能量。" }
    },
    {
      eat: { title: "黑松露意面配顶级红酒", description: "浓郁的香气与醇厚的口感交织，这是属于你的奢华时刻。" },
      wear: { title: "质感上乘的丝绸衬衫", description: "丝滑的触感能抚平内心的躁动，低调的奢华感最能衬托你今日温润如玉的气质。" },
      use: { title: "那瓶珍藏已久的红酒", description: "在微醺中回顾近期的收获，酒精的芬芳能激发你对未来的更多灵感与期待。" },
      action: { title: "参观一场私人艺术展", description: "在艺术的熏陶中提升审美，寻找生活与事业的新灵感。" }
    }
  ],
  calm: [
    {
      eat: { title: "温润养胃的小米粥", description: "清淡的饮食能减轻身体的负担，温热的粥品能由内而外地温暖你的身心。" },
      wear: { title: "素雅的莫兰迪色系", description: "低饱和度的色彩能营造出一种高级的宁静感，让你在视觉上和心理上都感到平和。" },
      use: { title: "瑜伽垫", description: "通过呼吸与拉伸与身体对话，在静谧的氛围中找回内心的平衡与力量。" },
      action: { title: "进行一场深度冥想", description: "闭上双眼，感受呼吸的律动，让杂乱的思绪在静默中沉淀。" }
    },
    {
      eat: { title: "中式下午茶", description: "一壶清茶，几块点心，在茶香袅袅中感受时光的流逝，享受这份难得的静谧。" },
      wear: { title: "宽松舒适的居家服", description: "摆脱束缚，让身体彻底放松，这种无拘无束的状态能让你更好地恢复元气。" },
      use: { title: "一个舒适的靠枕", description: "找一个阳光充足的角落，靠在柔软的枕头上，沉浸在书本的世界里忘却烦恼。" },
      action: { title: "整理书架或桌面", description: "在有序的整理中找回掌控感，清空物理空间的同时也清空心理负担。" }
    }
  ],
  energetic: [
    {
      eat: { title: "牛排能量碗", description: "均衡的营养搭配和充足的热量能支撑你高强度的工作，让你始终保持最佳状态。" },
      wear: { title: "干练的职场通勤装", description: "职业化的着装能给你带来心理暗示，让你在处理事务时更加果断、高效且专业。" },
      use: { title: "降噪耳机", description: "隔绝外界的干扰，创造一个属于自己的专注空间，今日的产出将超乎你的想象。" },
      action: { title: "完成一项拖延已久的任务", description: "利用今日的高能量状态，攻克那个最难的关卡，享受成就感带来的多巴胺。" }
    },
    {
      eat: { title: "高蛋白鸡胸肉料理", description: "为肌肉提供必要的修复养分，清淡的调味能让你更好地感受食材本来的鲜美。" },
      wear: { title: "专业运动装备", description: "良好的支撑与排汗性能能让你在运动中更加自如，鲜艳的色彩则能激发你的运动热情。" },
      use: { title: "智能手表", description: "实时监测你的心率与消耗，让运动变得科学且有成就感，见证身体的每一次进步。" },
      action: { title: "尝试一次高强度间歇训练(HIIT)", description: "挑战体能极限，让汗水带走压力，唤醒沉睡的身体潜能。" }
    }
  ],
  simple: [
    {
      eat: { title: "清爽的越南河粉", description: "简单的食材往往蕴含着最纯粹的美味，清淡的汤底能让你的肠胃得到彻底的放松。" },
      wear: { title: "白T恤与牛仔裤", description: "最简单的搭配往往最能经受时间的考验，这种随性自在的状态正是你今日魅力的源泉。" },
      use: { title: "一张手写明信片", description: "在这个数字化时代，手写的文字更显珍贵，将你的思念与祝福寄给远方的亲友吧。" },
      action: { title: "去公园散步半小时", description: "呼吸新鲜空气，观察路边的花草，在自然中找回最本真的快乐。" }
    },
    {
      eat: { title: "手工全麦面包配果酱", description: "天然的麦香与酸甜的果酱，开启简单而充实的一天。" },
      wear: { title: "柔软的棉麻长裙/长裤", description: "天然材质的呼吸感让你感到前所未有的自由与舒适。" },
      use: { title: "一个极简风格的帆布袋", description: "装下必需品，轻装上阵，生活本就不该被繁琐所累。" },
      action: { title: "关闭手机通知一小时", description: "享受一段不被打扰的时光，重新夺回对注意力的控制权。" }
    }
  ],
  social: [
    {
      eat: { title: "韩式部队锅", description: "热气腾腾的火锅最适合多人围坐，在分享美食的过程中拉近彼此的心灵距离。" },
      wear: { title: "精致的耳环或项链", description: "细节处的点缀能展现你的品味，在不经意间吸引那个与你有缘的人的目光。" },
      use: { title: "心理学书籍", description: "深入了解人际互动的奥秘，能让你在今日的社交场合中更加游盈有余，把握缘分。" },
      action: { title: "主动联系一位久未谋面的老友", description: "一声简单的问候可能开启一段温暖的回忆，重拾那些珍贵的友谊。" }
    },
    {
      eat: { title: "色彩缤纷的水果蛋糕", description: "甜食能迅速提升多巴胺水平，缤纷的色彩则预示着今日生活的多姿多彩。" },
      wear: { title: "带有印花元素的单品", description: "活泼的印花能表达你内心的喜悦，让周围的人也能感受到你传递出的积极能量。" },
      use: { title: "蓝牙音箱", description: "调高音量，让欢快的旋律充满整个房间，今日适合举办一场小型的庆祝派对。" },
      action: { title: "参加一个感兴趣的线下工作坊", description: "在学习新技能的同时结交志同道合的朋友，拓宽你的社交圈。" }
    }
  ],
  wisdom: [
    {
      eat: { title: "黑巧克力", description: "微苦的滋味能让你保持清醒，丰富的抗氧化成分则能为你的大脑提供充足的养分。" },
      wear: { title: "深蓝色套装", description: "蓝色代表着理智与深邃，这种稳重的穿搭能让你在思考时更具逻辑感与说服力。" },
      use: { title: "思维导图工具", description: "将脑海中闪现的灵感碎片系统化，你会惊讶地发现那些原本复杂的问题竟如此简单。" },
      action: { title: "复盘过去一周的得失", description: "在总结中发现规律，在反思中获得成长，智慧往往源于对经验的深度加工。" }
    },
    {
      eat: { title: "清淡的素食料理", description: "纯净的饮食能让你的头脑更加清明，在咀嚼中感受大自然的馈赠与生命的宁静。" },
      wear: { title: "极简风格黑白配", description: "经典的色彩搭配能减少视觉干扰，让你看起来更加睿智且富有深度，不被表象所惑。" },
      use: { title: "望远镜", description: "拓宽你的视野，从宏观的角度审视生活，你会发现许多原本被忽略的细节与真相。" },
      action: { title: "阅读一本深奥的哲学或科学书籍", description: "挑战思维的边界，与伟大的灵魂对话，在知识的海洋中寻找生命的真谛。" }
    }
  ]
};
