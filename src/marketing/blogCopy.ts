import type { MarketingLocale } from './config'

type BlogCopy = { title: string, description: string, backToList: string, createPoll: string }

export const blogCopy: Record<MarketingLocale, BlogCopy> = {
  'en': {
    title: 'Blog',
    description: 'Practical ways to find a time and place for friends, team outings, and study groups.',
    backToList: 'Back to articles',
    createPoll: 'Create a scheduling poll',
  },
  'zh-CN': {
    title: '博客',
    description: '和朋友聚会、团队聚餐或小组学习时，如何确定大家方便的时间和地点。',
    backToList: '返回文章列表',
    createPoll: '创建时间投票',
  },
  'hi': {
    title: 'ब्लॉग',
    description: 'दोस्तों, टीम और स्टडी ग्रुप के लिए समय और जगह तय करने के आसान तरीके।',
    backToList: 'लेखों की सूची पर लौटें',
    createPoll: 'समय तय करने के लिए पोल बनाएँ',
  },
  'es': {
    title: 'Blog',
    description: 'Ideas prácticas para elegir la hora y el lugar de reuniones con amigos, equipos y grupos de estudio.',
    backToList: 'Volver a los artículos',
    createPoll: 'Crear una encuesta de horarios',
  },
  'ar': {
    title: 'المدونة',
    description: 'طرق عملية لاختيار وقت ومكان يناسبان لقاءات الأصدقاء وفرق العمل ومجموعات الدراسة.',
    backToList: 'العودة إلى المقالات',
    createPoll: 'إنشاء استطلاع للمواعيد',
  },
  'fr': {
    title: 'Blog',
    description: 'Des conseils pour trouver un horaire et un lieu pour vos sorties entre amis, repas d’équipe et séances de révision.',
    backToList: 'Retour aux articles',
    createPoll: 'Créer un sondage de disponibilités',
  },
  'bn': {
    title: 'ব্লগ',
    description: 'বন্ধুদের আড্ডা, দলের অনুষ্ঠান ও পড়ার গ্রুপের সময় এবং জায়গা ঠিক করার উপায়।',
    backToList: 'লেখার তালিকায় ফিরুন',
    createPoll: 'সময় ঠিক করার জন্য ভোট চালু করুন',
  },
  'pt': {
    title: 'Blog',
    description: 'Dicas para escolher o horário e o local de encontros com amigos, equipes e grupos de estudo.',
    backToList: 'Voltar aos artigos',
    createPoll: 'Criar uma enquete de horários',
  },
  'ru': {
    title: 'Блог',
    description: 'Как подобрать время и место для встречи с друзьями, коллегами или учебной группой.',
    backToList: 'К списку статей',
    createPoll: 'Создать опрос по времени встречи',
  },
  'id': {
    title: 'Blog',
    description: 'Cara memilih waktu dan tempat untuk kumpul bersama teman, tim, atau kelompok belajar.',
    backToList: 'Kembali ke daftar artikel',
    createPoll: 'Buat jajak pendapat jadwal',
  },
  'ur': {
    title: 'بلاگ',
    description: 'دوستوں، ساتھیوں اور مطالعاتی گروپ کے لیے ملاقات کا وقت اور جگہ طے کرنے کے طریقے۔',
    backToList: 'مضامین کی فہرست پر واپس جائیں',
    createPoll: 'وقت طے کرنے کے لیے پول بنائیں',
  },
  'de': {
    title: 'Blog',
    description: 'Praktische Tipps für die Termin- und Ortswahl bei Treffen mit Freunden, dem Team oder der Lerngruppe.',
    backToList: 'Zurück zur Artikelübersicht',
    createPoll: 'Terminumfrage erstellen',
  },
  'ja': {
    title: 'ブログ',
    description: '友人との集まりやチームの食事会、勉強会で、都合のよい日時と場所を決めるコツを紹介します。',
    backToList: '記事一覧に戻る',
    createPoll: '日程調整の投票を作る',
  },
  'pcm': {
    title: 'Blog',
    description: 'How to find time and place wey go work for friends, work team, or study group.',
    backToList: 'Go back to di list of articles',
    createPoll: 'Create poll to choose time',
  },
  'ar-EG': {
    title: 'المدونة',
    description: 'أفكار عملية عشان تختار معاد ومكان مناسبين لخروجة مع صحابك أو لتجمع الشغل أو المذاكرة.',
    backToList: 'ارجع لقائمة المقالات',
    createPoll: 'اعمل تصويت على المعاد',
  },
  'mr': {
    title: 'ब्लॉग',
    description: 'मित्रमैत्रिणी, सहकारी आणि अभ्यासगट यांना सोयीची वेळ आणि जागा ठरवण्याचे मार्ग.',
    backToList: 'लेखांच्या यादीवर परत जा',
    createPoll: 'वेळ ठरवण्यासाठी मतदान तयार करा',
  },
  'vi': {
    title: 'Blog',
    description: 'Cách chọn thời gian và địa điểm phù hợp khi gặp bạn bè, đồng nghiệp hoặc nhóm học.',
    backToList: 'Quay lại danh sách bài viết',
    createPoll: 'Tạo bình chọn lịch hẹn',
  },
  'te': {
    title: 'బ్లాగ్',
    description: 'స్నేహితులు, సహోద్యోగులు, స్టడీ గ్రూపుతో కలవడానికి సమయం, స్థలం ఎంచుకునే పద్ధతులు.',
    backToList: 'వ్యాసాల జాబితాకు తిరిగి వెళ్లండి',
    createPoll: 'సమయం ఎంచుకోవడానికి పోల్ సృష్టించండి',
  },
  'ha': {
    title: 'Blog',
    description: 'Hanyoyin zaɓar lokaci da wuri don haɗuwa da abokai, abokan aiki ko ƙungiyar karatu.',
    backToList: 'Koma jerin rubuce-rubuce',
    createPoll: 'Ƙirƙiri zaɓen lokacin haɗuwa',
  },
  'tr': {
    title: 'Blog',
    description: 'Arkadaş buluşmaları, ekip yemekleri ve çalışma grupları için uygun zaman ve yer seçmenin yolları.',
    backToList: 'Yazı listesine dön',
    createPoll: 'Zaman anketi oluştur',
  },
  'ko': {
    title: '블로그',
    description: '친구 모임, 회식, 스터디에서 모두가 가능한 시간과 장소를 정하는 방법을 소개합니다.',
    backToList: '글 목록으로',
    createPoll: '일정 투표 만들기',
  },
  'th': {
    title: 'บล็อก',
    description: 'วิธีเลือกเวลาและสถานที่นัดพบเพื่อน ทีมงาน หรือกลุ่มอ่านหนังสือ',
    backToList: 'กลับไปที่รายการบทความ',
    createPoll: 'สร้างโหวตเลือกเวลานัด',
  },
}
