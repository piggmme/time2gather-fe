import type { MarketingLocale } from './config'

type Item = { title: string, body: string }
type LinkLabels = {
  home: string
  about: string
  contact: string
  privacy: string
  terms: string
  language: string
}

export type MarketingCopy = {
  metaTitle: string
  metaDescription: string
  nav: LinkLabels
  hero: {
    eyebrow: string
    title: string
    description: string
    primary: string
    secondary: string
  }
  featuresTitle: string
  features: Item[]
  stepsTitle: string
  steps: Item[]
  faqTitle: string
  faqs: Item[]
  about: { title: string, intro: string, sections: Item[] }
  contact: {
    title: string
    intro: string
    emailTitle: string
    emailBody: string
    responseTitle: string
    responseBody: string
  }
  privacy: { title: string, intro: string, sections: Item[] }
  terms: { title: string, intro: string, sections: Item[] }
  updated: string
  footer: string
}

export const marketingCopy: Record<MarketingLocale, MarketingCopy> = {
  'ko': {
    metaTitle: 'Time2Gather - 모두가 가능한 약속 시간을 한 번에',
    metaDescription: '로그인 없이 날짜, 시간, 장소를 투표하고 모두에게 맞는 일정을 확정하는 무료 그룹 일정 조율 서비스입니다.',
    nav: {
      home: '홈', about: '소개', contact: '문의', privacy: '개인정보', terms: '이용약관', language: '언어',
    },
    hero: {
      eyebrow: '모두의 일정을 한곳에서 조율하세요',
      title: '약속 시간 정하기를 더 간단하게',
      description: '후보 날짜와 시간을 공유하고 투표를 받으세요. 참여자는 로그인 없이 응답하고, 방장은 가장 좋은 일정을 바로 확정할 수 있어요.',
      primary: '약속 만들기',
      secondary: '코드로 찾기',
    },
    featuresTitle: '함께 정하는 데 필요한 기능',
    features: [
      { title: '날짜 후보 비교', body: '여러 날짜를 제안하고 참여 가능한 사람 수를 한눈에 비교합니다.' },
      { title: '시간대 투표', body: '세부 시간까지 받아 가장 많은 사람이 가능한 시간을 찾습니다.' },
      { title: '장소도 함께 결정', body: '필요하면 장소 후보를 추가해 선호도를 함께 모을 수 있습니다.' },
      { title: '로그인 없는 참여', body: '링크 하나와 닉네임만으로 바로 투표할 수 있습니다.' },
    ],
    stepsTitle: '세 단계면 충분해요',
    steps: [
      { title: '1. 후보 만들기', body: '약속 이름과 가능한 날짜 또는 시간을 입력합니다.' },
      { title: '2. 링크 공유하기', body: '친구, 팀원, 모임 구성원에게 링크를 보냅니다.' },
      { title: '3. 일정 확정하기', body: '투표 결과를 보고 모두에게 맞는 일정을 확정합니다.' },
    ],
    faqTitle: '자주 묻는 질문',
    faqs: [
      { title: 'Time2Gather는 무엇인가요?', body: '여러 사람의 가능한 날짜와 시간을 투표로 모아 최적의 약속 시간을 찾는 무료 서비스입니다.' },
      { title: '참여자도 로그인해야 하나요?', body: '아니요. 참여자는 닉네임만 입력하고 바로 투표할 수 있습니다.' },
      { title: '장소도 투표할 수 있나요?', body: '네. 약속을 만들 때 장소 투표를 켜고 여러 후보를 추가할 수 있습니다.' },
    ],
    about: {
      title: 'Time2Gather 소개',
      intro: 'Time2Gather는 단체 일정 조율에 드는 대화와 반복을 줄이기 위해 만든 무료 일정 투표 서비스입니다.',
      sections: [
        { title: '우리의 목적', body: '누구나 링크 하나로 참여하고, 날짜·시간·장소에 대한 의견을 투명하게 모을 수 있게 합니다.' },
        { title: '작동 방식', body: '방장이 후보를 만들고 링크를 공유하면 참여자들이 가능한 시간을 선택합니다. 결과를 확인한 뒤 최종 일정을 확정할 수 있습니다.' },
        { title: '우리가 중요하게 생각하는 것', body: '쉬운 참여, 명확한 결과, 최소한의 개인정보 수집, 모바일과 데스크톱에서 일관된 경험을 우선합니다.' },
      ],
    },
    contact: {
      title: '문의하기',
      intro: '서비스 사용, 오류 신고, 개인정보 요청 또는 제안이 있다면 이메일로 알려주세요.',
      emailTitle: '이메일',
      emailBody: '문의 내용과 사용한 브라우저, 문제가 발생한 화면을 함께 보내주시면 확인에 도움이 됩니다.',
      responseTitle: '답변 안내',
      responseBody: '가능한 한 빠르게 확인하며, 개인정보 관련 요청은 본인 확인이 필요할 수 있습니다.',
    },
    privacy: {
      title: '개인정보 처리방침',
      intro: 'Time2Gather는 일정 조율 기능 제공에 필요한 정보만 처리하고, 개인정보를 판매하지 않습니다.',
      sections: [
        { title: '처리하는 정보', body: '로그인 시 제공되는 계정 기본정보, 약속 제목과 후보, 투표 선택, 닉네임, 세션 및 기본 접속 정보가 포함될 수 있습니다.' },
        { title: '이용 목적', body: '약속 생성·참여·확정, 계정 관리, 보안, 오류 대응과 서비스 개선을 위해 사용합니다.' },
        { title: '분석과 외부 서비스', body: '서비스 이용 현황 파악을 위해 Google Analytics를 사용할 수 있으며, 호스팅과 인증 제공자가 필요한 범위에서 정보를 처리할 수 있습니다.' },
        { title: '보관과 이용자 권리', body: '서비스 제공과 법적 의무에 필요한 기간 동안 보관합니다. 열람, 수정 또는 삭제 요청은 문의 페이지의 이메일로 접수할 수 있습니다.' },
        { title: '국외 처리', body: '사용 중인 인프라 제공자의 위치에 따라 정보가 거주 국가 밖에서 처리될 수 있으며, 합리적인 보호조치를 적용합니다.' },
      ],
    },
    terms: {
      title: '이용약관',
      intro: 'Time2Gather를 이용하면 아래 조건에 동의한 것으로 봅니다.',
      sections: [
        { title: '서비스 이용', body: '법률을 준수하며 다른 사람의 권리를 침해하지 않는 범위에서 일정 조율 목적으로 서비스를 이용할 수 있습니다.' },
        { title: '이용자의 책임', body: '공유하는 약속 내용과 링크 관리, 계정 보안, 입력한 정보에 대한 책임은 이용자에게 있습니다.' },
        { title: '서비스 변경과 가용성', body: '품질과 보안을 위해 기능을 변경하거나 일시 중단할 수 있으며, 중대한 변경은 합리적인 방법으로 안내합니다.' },
        { title: '권리와 제한', body: '서비스의 코드, 디자인과 브랜드 권리는 각 권리자에게 있습니다. 무단 복제, 방해 또는 악용은 허용되지 않습니다.' },
        { title: '책임의 범위', body: '서비스는 가능한 상태로 제공됩니다. 법이 허용하는 범위에서 간접 손해나 이용자가 입력한 정보로 인한 손해에 대해 책임을 제한합니다.' },
      ],
    },
    updated: '최종 업데이트: 2026년 10월 14일',
    footer: '모두가 가능한 시간을 더 쉽게 찾으세요.',
  },
  'en': {
    metaTitle: 'Time2Gather - Find a time that works for everyone',
    metaDescription: 'A free group scheduling poll for dates, times, and locations. Participants can vote without creating an account.',
    nav: {
      home: 'Home', about: 'About', contact: 'Contact', privacy: 'Privacy', terms: 'Terms', language: 'Language',
    },
    hero: {
      eyebrow: 'Coordinate everyone in one place',
      title: 'Make group scheduling simple',
      description: 'Share date and time options, collect availability, and confirm the best plan. Participants can vote without creating an account.',
      primary: 'Create a meeting',
      secondary: 'Find with a code',
    },
    featuresTitle: 'Everything you need to decide together',
    features: [
      { title: 'Compare dates', body: 'Suggest multiple dates and compare availability at a glance.' },
      { title: 'Vote on time slots', body: 'Collect detailed availability to find the time that works for the most people.' },
      { title: 'Choose a location', body: 'Add location options and collect preferences when your group needs them.' },
      { title: 'No sign-up to vote', body: 'Participants can respond right away with one link and a nickname.' },
    ],
    stepsTitle: 'Settle plans in three steps',
    steps: [
      { title: '1. Create options', body: 'Enter a meeting name and the dates or times to compare.' },
      { title: '2. Share the link', body: 'Send it to friends, teammates, or your group.' },
      { title: '3. Confirm the plan', body: 'Review the votes and confirm the best schedule for everyone.' },
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      { title: 'What is Time2Gather?', body: 'It is a free scheduling poll that collects group availability and helps you choose the best meeting time.' },
      { title: 'Do participants need an account?', body: 'No. Participants can enter a nickname and vote immediately.' },
      { title: 'Can we vote on locations?', body: 'Yes. Enable location voting when creating a meeting and add the options your group should compare.' },
    ],
    about: {
      title: 'About Time2Gather',
      intro: 'Time2Gather is a free scheduling poll built to reduce the back-and-forth of coordinating a group.',
      sections: [
        { title: 'Our purpose', body: 'We make it easy for anyone to join from one link and share clear availability for dates, times, and locations.' },
        { title: 'How it works', body: 'A host creates options and shares a link. Participants select what works, then the host reviews the result and confirms the final plan.' },
        { title: 'What we value', body: 'Easy participation, clear results, minimal data collection, and a consistent experience across mobile and desktop.' },
      ],
    },
    contact: {
      title: 'Contact us',
      intro: 'Email us about using the service, reporting a problem, privacy requests, or product suggestions.',
      emailTitle: 'Email',
      emailBody: 'Include your browser and the screen where the issue occurred when reporting a problem.',
      responseTitle: 'Responses',
      responseBody: 'We review messages as quickly as we can. Privacy requests may require identity verification.',
    },
    privacy: {
      title: 'Privacy Policy',
      intro: 'Time2Gather processes only the information needed to provide group scheduling and does not sell personal information.',
      sections: [
        { title: 'Information we process', body: 'This may include basic account details from a sign-in provider, meeting titles and options, votes, nicknames, session data, and basic connection information.' },
        { title: 'How we use information', body: 'We use it to create, join, and confirm meetings, manage accounts, protect the service, resolve errors, and improve the product.' },
        { title: 'Analytics and providers', body: 'We may use Google Analytics to understand usage. Hosting and authentication providers may process information as needed to provide their services.' },
        { title: 'Retention and your choices', body: 'We retain information as needed to provide the service and meet legal obligations. Contact us to request access, correction, or deletion.' },
        { title: 'International processing', body: 'Providers may process information outside your country. We use reasonable safeguards for those transfers.' },
      ],
    },
    terms: {
      title: 'Terms of Service',
      intro: 'By using Time2Gather, you agree to the following terms.',
      sections: [
        { title: 'Using the service', body: 'You may use the service for scheduling as long as you follow applicable law and respect the rights of others.' },
        { title: 'Your responsibilities', body: 'You are responsible for meeting content you share, link access, account security, and the information you submit.' },
        { title: 'Changes and availability', body: 'We may change or temporarily suspend features to maintain quality and security. We will provide reasonable notice of material changes.' },
        { title: 'Rights and restrictions', body: 'The code, design, and brand remain the property of their respective owners. Copying, disrupting, or abusing the service is not permitted.' },
        { title: 'Limitation of liability', body: 'The service is provided as available. To the extent allowed by law, liability is limited for indirect loss or loss caused by user-submitted information.' },
      ],
    },
    updated: 'Last updated: October 14, 2026',
    footer: 'Find a time that works for everyone.',
  },
  'es': {
    metaTitle: 'Time2Gather - Encuentra un horario para todos',
    metaDescription: 'Encuesta gratuita para coordinar fechas, horas y lugares. Los participantes pueden votar sin crear una cuenta.',
    nav: {
      home: 'Inicio', about: 'Quiénes somos', contact: 'Contacto', privacy: 'Privacidad', terms: 'Términos', language: 'Idioma',
    },
    hero: {
      eyebrow: 'Coordina al grupo en un solo lugar', title: 'Organizar un encuentro puede ser sencillo', description: 'Comparte opciones de fecha y hora, recoge la disponibilidad y confirma el mejor plan. Nadie necesita una cuenta para votar.', primary: 'Crear una reunión', secondary: 'Buscar con código',
    },
    featuresTitle: 'Todo lo necesario para decidir juntos',
    features: [
      { title: 'Compara fechas', body: 'Propón varias fechas y compara la disponibilidad de un vistazo.' },
      { title: 'Vota por horarios', body: 'Recoge horarios disponibles y encuentra la opción que funciona para más personas.' },
      { title: 'Elige el lugar', body: 'Añade opciones de ubicación y reúne las preferencias del grupo.' },
      { title: 'Vota sin registrarte', body: 'Los participantes responden con un enlace y un nombre.' },
    ],
    stepsTitle: 'Decide en tres pasos',
    steps: [{ title: '1. Crea opciones', body: 'Añade el nombre, las fechas y las horas.' }, { title: '2. Comparte el enlace', body: 'Envíalo a amigos, compañeros o al grupo.' }, { title: '3. Confirma el plan', body: 'Revisa los votos y fija el mejor horario.' }],
    faqTitle: 'Preguntas frecuentes',
    faqs: [{ title: '¿Qué es Time2Gather?', body: 'Una encuesta gratuita para reunir la disponibilidad de un grupo y elegir la mejor hora.' }, { title: '¿Hace falta una cuenta?', body: 'No. Basta con escribir un nombre y votar.' }, { title: '¿Podemos votar por lugares?', body: 'Sí. Activa la votación de lugares y añade las opciones del grupo.' }],
    about: { title: 'Acerca de Time2Gather', intro: 'Time2Gather es una herramienta gratuita creada para reducir los mensajes y repeticiones al coordinar un grupo.', sections: [{ title: 'Nuestro propósito', body: 'Permitir que cualquiera participe desde un enlace y comparta su disponibilidad con claridad.' }, { title: 'Cómo funciona', body: 'El anfitrión crea opciones, comparte el enlace, revisa los votos y confirma el plan.' }, { title: 'Nuestros valores', body: 'Participación sencilla, resultados claros, pocos datos y una experiencia coherente.' }] },
    contact: {
      title: 'Contacto', intro: 'Escríbenos sobre el servicio, errores, privacidad o sugerencias.', emailTitle: 'Correo electrónico', emailBody: 'Al informar de un problema, incluye el navegador y la pantalla donde ocurrió.', responseTitle: 'Respuestas', responseBody: 'Revisamos los mensajes lo antes posible. Las solicitudes de privacidad pueden requerir verificación.',
    },
    privacy: { title: 'Política de privacidad', intro: 'Time2Gather trata solo la información necesaria para coordinar grupos y no vende datos personales.', sections: [{ title: 'Información tratada', body: 'Puede incluir datos básicos de cuenta, reuniones, opciones, votos, nombres, sesión y conexión.' }, { title: 'Uso de la información', body: 'La usamos para ofrecer reuniones, gestionar cuentas, proteger y mejorar el servicio.' }, { title: 'Analítica y proveedores', body: 'Podemos usar Google Analytics. Los proveedores de alojamiento y autenticación procesan lo necesario.' }, { title: 'Conservación y opciones', body: 'Conservamos los datos mientras sean necesarios. Puedes pedir acceso, corrección o eliminación.' }, { title: 'Tratamiento internacional', body: 'Los proveedores pueden tratar datos fuera de tu país con medidas de protección razonables.' }] },
    terms: { title: 'Términos del servicio', intro: 'Al usar Time2Gather aceptas estas condiciones.', sections: [{ title: 'Uso del servicio', body: 'Usa el servicio legalmente y respeta los derechos de otras personas.' }, { title: 'Tus responsabilidades', body: 'Eres responsable del contenido, los enlaces, la cuenta y los datos que compartes.' }, { title: 'Cambios y disponibilidad', body: 'Podemos modificar o pausar funciones por calidad y seguridad.' }, { title: 'Derechos y restricciones', body: 'No se permite copiar, interrumpir ni abusar del servicio.' }, { title: 'Responsabilidad', body: 'El servicio se ofrece según disponibilidad y la responsabilidad se limita donde la ley lo permita.' }] },
    updated: 'Última actualización: 14 de octubre de 2026', footer: 'Encuentra un horario que funcione para todos.',
  },
  'pt': {
    metaTitle: 'Time2Gather - Encontre um horário para todos',
    metaDescription: 'Enquete gratuita para organizar datas, horários e locais. Participantes votam sem criar conta.',
    nav: {
      home: 'Início', about: 'Sobre', contact: 'Contato', privacy: 'Privacidade', terms: 'Termos', language: 'Idioma',
    },
    hero: {
      eyebrow: 'Organize o grupo em um só lugar', title: 'Marcar um encontro pode ser simples', description: 'Compartilhe opções, reúna a disponibilidade e confirme o melhor plano. Ninguém precisa criar conta para votar.', primary: 'Criar encontro', secondary: 'Buscar por código',
    },
    featuresTitle: 'Tudo para decidir em grupo',
    features: [{ title: 'Compare datas', body: 'Sugira várias datas e compare a disponibilidade rapidamente.' }, { title: 'Vote em horários', body: 'Reúna horários e encontre a opção que serve para mais pessoas.' }, { title: 'Escolha o local', body: 'Adicione locais e reúna as preferências do grupo.' }, { title: 'Vote sem cadastro', body: 'Os participantes respondem com um link e um nome.' }],
    stepsTitle: 'Resolva em três passos',
    steps: [{ title: '1. Crie opções', body: 'Informe o nome, as datas e os horários.' }, { title: '2. Compartilhe o link', body: 'Envie para amigos, colegas ou seu grupo.' }, { title: '3. Confirme o plano', body: 'Confira os votos e escolha o melhor horário.' }],
    faqTitle: 'Perguntas frequentes',
    faqs: [{ title: 'O que é o Time2Gather?', body: 'Uma enquete gratuita para reunir disponibilidades e escolher o melhor horário.' }, { title: 'Precisa criar conta?', body: 'Não. Basta informar um nome e votar.' }, { title: 'Podemos votar no local?', body: 'Sim. Ative a votação de local e adicione as opções.' }],
    about: { title: 'Sobre o Time2Gather', intro: 'Time2Gather é uma ferramenta gratuita criada para reduzir mensagens e retrabalho ao organizar um grupo.', sections: [{ title: 'Nosso propósito', body: 'Permitir que todos participem por um link e compartilhem sua disponibilidade com clareza.' }, { title: 'Como funciona', body: 'O organizador cria opções, compartilha o link, confere os votos e confirma o plano.' }, { title: 'O que valorizamos', body: 'Participação fácil, resultados claros, poucos dados e uma experiência consistente.' }] },
    contact: {
      title: 'Contato', intro: 'Fale conosco sobre o serviço, erros, privacidade ou sugestões.', emailTitle: 'E-mail', emailBody: 'Ao relatar um problema, informe o navegador e a tela em que ocorreu.', responseTitle: 'Respostas', responseBody: 'Analisamos as mensagens o quanto antes. Pedidos de privacidade podem exigir verificação.',
    },
    privacy: { title: 'Política de Privacidade', intro: 'Time2Gather trata apenas os dados necessários para organizar grupos e não vende informações pessoais.', sections: [{ title: 'Dados tratados', body: 'Podem incluir dados básicos da conta, reuniões, opções, votos, nomes, sessão e conexão.' }, { title: 'Como usamos', body: 'Usamos para oferecer reuniões, gerenciar contas, proteger e melhorar o serviço.' }, { title: 'Análise e provedores', body: 'Podemos usar Google Analytics. Provedores de hospedagem e autenticação tratam o necessário.' }, { title: 'Retenção e escolhas', body: 'Mantemos dados enquanto necessários. Você pode pedir acesso, correção ou exclusão.' }, { title: 'Tratamento internacional', body: 'Provedores podem tratar dados fora do seu país com proteções razoáveis.' }] },
    terms: { title: 'Termos de Serviço', intro: 'Ao usar o Time2Gather, você aceita estas condições.', sections: [{ title: 'Uso do serviço', body: 'Use o serviço legalmente e respeite os direitos de outras pessoas.' }, { title: 'Suas responsabilidades', body: 'Você responde pelo conteúdo, links, conta e dados enviados.' }, { title: 'Mudanças e disponibilidade', body: 'Podemos alterar ou pausar recursos por qualidade e segurança.' }, { title: 'Direitos e restrições', body: 'Não é permitido copiar, interromper ou abusar do serviço.' }, { title: 'Responsabilidade', body: 'O serviço é oferecido conforme disponível, com limites permitidos por lei.' }] },
    updated: 'Última atualização: 14 de outubro de 2026', footer: 'Encontre um horário que funcione para todos.',
  },
  'fr': {
    metaTitle: 'Time2Gather - Trouvez un créneau pour tout le monde',
    metaDescription: 'Sondage gratuit pour choisir dates, horaires et lieux. Les participants votent sans créer de compte.',
    nav: {
      home: 'Accueil', about: 'À propos', contact: 'Contact', privacy: 'Confidentialité', terms: 'Conditions', language: 'Langue',
    },
    hero: {
      eyebrow: 'Coordonnez votre groupe au même endroit', title: 'Planifier ensemble devient simple', description: 'Partagez des options, recueillez les disponibilités et confirmez le meilleur choix. Aucun compte n’est requis pour voter.', primary: 'Créer une réunion', secondary: 'Rechercher par code',
    },
    featuresTitle: 'Tout pour décider ensemble',
    features: [{ title: 'Comparez les dates', body: 'Proposez plusieurs dates et comparez les disponibilités.' }, { title: 'Votez sur les horaires', body: 'Trouvez le créneau qui convient au plus grand nombre.' }, { title: 'Choisissez un lieu', body: 'Ajoutez des lieux et recueillez les préférences.' }, { title: 'Vote sans inscription', body: 'Un lien et un nom suffisent pour participer.' }],
    stepsTitle: 'Décidez en trois étapes',
    steps: [{ title: '1. Créez les options', body: 'Ajoutez le nom, les dates et les horaires.' }, { title: '2. Partagez le lien', body: 'Envoyez-le à vos amis, collègues ou groupe.' }, { title: '3. Confirmez', body: 'Consultez les votes et fixez le meilleur créneau.' }],
    faqTitle: 'Questions fréquentes',
    faqs: [{ title: 'Qu’est-ce que Time2Gather ?', body: 'Un sondage gratuit pour recueillir les disponibilités d’un groupe.' }, { title: 'Faut-il un compte ?', body: 'Non. Les participants saisissent un nom et votent immédiatement.' }, { title: 'Peut-on voter sur le lieu ?', body: 'Oui. Activez le vote de lieu et ajoutez les choix.' }],
    about: { title: 'À propos de Time2Gather', intro: 'Time2Gather est un outil gratuit conçu pour réduire les échanges nécessaires à la planification en groupe.', sections: [{ title: 'Notre mission', body: 'Permettre à chacun de participer avec un lien et de partager clairement ses disponibilités.' }, { title: 'Fonctionnement', body: 'L’organisateur crée des options, partage le lien, consulte les votes et confirme le choix.' }, { title: 'Nos priorités', body: 'Participation simple, résultats clairs, collecte minimale et expérience cohérente.' }] },
    contact: {
      title: 'Nous contacter', intro: 'Écrivez-nous pour une question, un problème, la confidentialité ou une suggestion.', emailTitle: 'E-mail', emailBody: 'Pour un problème, indiquez le navigateur et l’écran concerné.', responseTitle: 'Réponses', responseBody: 'Nous répondons dès que possible. Une vérification peut être nécessaire pour les demandes de confidentialité.',
    },
    privacy: { title: 'Politique de confidentialité', intro: 'Time2Gather traite uniquement les informations nécessaires et ne vend pas les données personnelles.', sections: [{ title: 'Informations traitées', body: 'Elles peuvent inclure compte, réunions, options, votes, noms, session et connexion.' }, { title: 'Utilisation', body: 'Elles servent à fournir, sécuriser et améliorer le service.' }, { title: 'Analyse et prestataires', body: 'Google Analytics et nos prestataires techniques peuvent traiter les données nécessaires.' }, { title: 'Conservation et choix', body: 'Les données sont conservées selon les besoins. Vous pouvez demander accès, correction ou suppression.' }, { title: 'Traitement international', body: 'Des prestataires peuvent traiter les données hors de votre pays avec des garanties raisonnables.' }] },
    terms: { title: 'Conditions d’utilisation', intro: 'En utilisant Time2Gather, vous acceptez ces conditions.', sections: [{ title: 'Utilisation', body: 'Utilisez le service légalement et respectez les droits d’autrui.' }, { title: 'Vos responsabilités', body: 'Vous êtes responsable du contenu, des liens, du compte et des données transmis.' }, { title: 'Modifications et disponibilité', body: 'Nous pouvons modifier ou suspendre des fonctions pour la qualité et la sécurité.' }, { title: 'Droits et restrictions', body: 'Il est interdit de copier, perturber ou détourner le service.' }, { title: 'Responsabilité', body: 'Le service est fourni selon disponibilité, dans les limites autorisées par la loi.' }] },
    updated: 'Dernière mise à jour : 14 octobre 2026', footer: 'Trouvez un créneau qui convient à tout le monde.',
  },
  'de': {
    metaTitle: 'Time2Gather - Findet einen Termin für alle',
    metaDescription: 'Kostenlose Gruppenabstimmung für Datum, Uhrzeit und Ort. Teilnehmende stimmen ohne Konto ab.',
    nav: {
      home: 'Start', about: 'Über uns', contact: 'Kontakt', privacy: 'Datenschutz', terms: 'Bedingungen', language: 'Sprache',
    },
    hero: {
      eyebrow: 'Alle Termine an einem Ort koordinieren', title: 'Gruppentermine einfach planen', description: 'Teile Optionen, sammle Verfügbarkeiten und bestätige den besten Termin. Zur Abstimmung ist kein Konto nötig.', primary: 'Termin erstellen', secondary: 'Mit Code suchen',
    },
    featuresTitle: 'Alles für eine gemeinsame Entscheidung',
    features: [{ title: 'Daten vergleichen', body: 'Schlage mehrere Tage vor und vergleiche die Verfügbarkeit.' }, { title: 'Über Uhrzeiten abstimmen', body: 'Finde den Zeitraum, der für die meisten passt.' }, { title: 'Ort auswählen', body: 'Füge Orte hinzu und sammle Präferenzen.' }, { title: 'Ohne Anmeldung abstimmen', body: 'Ein Link und ein Name reichen zur Teilnahme.' }],
    stepsTitle: 'In drei Schritten zum Termin',
    steps: [{ title: '1. Optionen erstellen', body: 'Name, Tage und Uhrzeiten eingeben.' }, { title: '2. Link teilen', body: 'An Freunde, Kollegen oder die Gruppe senden.' }, { title: '3. Termin bestätigen', body: 'Stimmen prüfen und den besten Termin festlegen.' }],
    faqTitle: 'Häufige Fragen',
    faqs: [{ title: 'Was ist Time2Gather?', body: 'Eine kostenlose Abstimmung, die Gruppenverfügbarkeiten sammelt.' }, { title: 'Brauchen Teilnehmende ein Konto?', body: 'Nein. Name eingeben und direkt abstimmen.' }, { title: 'Kann man über Orte abstimmen?', body: 'Ja. Aktiviere die Ortsabstimmung und füge Optionen hinzu.' }],
    about: { title: 'Über Time2Gather', intro: 'Time2Gather ist ein kostenloses Werkzeug, das die Abstimmung von Gruppenterminen vereinfacht.', sections: [{ title: 'Unser Ziel', body: 'Jeder soll über einen Link teilnehmen und Verfügbarkeiten klar teilen können.' }, { title: 'So funktioniert es', body: 'Optionen erstellen, Link teilen, Stimmen prüfen und den Termin bestätigen.' }, { title: 'Unsere Werte', body: 'Einfache Teilnahme, klare Ergebnisse, wenige Daten und eine konsistente Nutzung.' }] },
    contact: {
      title: 'Kontakt', intro: 'Schreib uns zu Nutzung, Fehlern, Datenschutz oder Vorschlägen.', emailTitle: 'E-Mail', emailBody: 'Nenne bei Fehlern bitte Browser und betroffene Seite.', responseTitle: 'Antworten', responseBody: 'Wir prüfen Nachrichten schnellstmöglich. Datenschutzanfragen können eine Identitätsprüfung erfordern.',
    },
    privacy: { title: 'Datenschutzerklärung', intro: 'Time2Gather verarbeitet nur erforderliche Informationen und verkauft keine personenbezogenen Daten.', sections: [{ title: 'Verarbeitete Informationen', body: 'Dazu können Konto-, Termin-, Options-, Abstimmungs-, Sitzungs- und Verbindungsdaten gehören.' }, { title: 'Verwendung', body: 'Wir nutzen sie zur Bereitstellung, Verwaltung, Sicherheit und Verbesserung.' }, { title: 'Analyse und Anbieter', body: 'Google Analytics und technische Anbieter können erforderliche Daten verarbeiten.' }, { title: 'Speicherung und Rechte', body: 'Daten werden nur so lange wie nötig gespeichert. Zugriff, Berichtigung oder Löschung kann angefragt werden.' }, { title: 'Internationale Verarbeitung', body: 'Anbieter können Daten mit angemessenen Schutzmaßnahmen außerhalb deines Landes verarbeiten.' }] },
    terms: { title: 'Nutzungsbedingungen', intro: 'Mit der Nutzung von Time2Gather stimmst du diesen Bedingungen zu.', sections: [{ title: 'Nutzung', body: 'Nutze den Dienst rechtmäßig und respektiere die Rechte anderer.' }, { title: 'Verantwortung', body: 'Du bist für Inhalte, Links, Konto und übermittelte Daten verantwortlich.' }, { title: 'Änderungen und Verfügbarkeit', body: 'Funktionen können für Qualität und Sicherheit geändert oder pausiert werden.' }, { title: 'Rechte und Einschränkungen', body: 'Kopieren, Stören oder Missbrauch des Dienstes ist nicht erlaubt.' }, { title: 'Haftung', body: 'Der Dienst wird nach Verfügbarkeit und im gesetzlich zulässigen Rahmen angeboten.' }] },
    updated: 'Zuletzt aktualisiert: 14. Oktober 2026', footer: 'Findet einen Termin, der für alle passt.',
  },
  'ja': {
    metaTitle: 'Time2Gather - みんなの都合が合う時間を見つけよう',
    metaDescription: '日付・時間・場所を投票で決める無料の日程調整サービス。参加者はアカウントなしで回答できます。',
    nav: {
      home: 'ホーム', about: 'サービス紹介', contact: 'お問い合わせ', privacy: 'プライバシー', terms: '利用規約', language: '言語',
    },
    hero: {
      eyebrow: 'みんなの予定を一か所で調整', title: 'グループの日程調整をシンプルに', description: '候補日と時間を共有して、参加可能な時間を集めましょう。参加者はアカウントを作らずに投票できます。', primary: '予定を作成', secondary: 'コードで検索',
    },
    featuresTitle: 'みんなで決めるための機能',
    features: [{ title: '候補日を比較', body: '複数の日付を提案し、参加できる人数をすぐに比較できます。' }, { title: '時間帯に投票', body: '細かな時間まで集め、最も多くの人が参加できる時間を探します。' }, { title: '場所も選択', body: '場所の候補を追加し、希望をまとめられます。' }, { title: '登録なしで投票', body: 'リンクと名前だけですぐに参加できます。' }],
    stepsTitle: '3ステップで決定',
    steps: [{ title: '1. 候補を作る', body: '予定名と日付・時間を入力します。' }, { title: '2. リンクを共有', body: '友人やチームに送ります。' }, { title: '3. 予定を確定', body: '結果を確認して最適な時間を決めます。' }],
    faqTitle: 'よくある質問',
    faqs: [{ title: 'Time2Gatherとは？', body: 'グループの空き時間を集め、最適な予定を決める無料の投票サービスです。' }, { title: '参加者にアカウントは必要？', body: '必要ありません。名前を入力してすぐに投票できます。' }, { title: '場所にも投票できますか？', body: 'はい。予定作成時に場所投票を有効にして候補を追加できます。' }],
    about: { title: 'Time2Gatherについて', intro: 'Time2Gatherは、グループの日程調整で何度も連絡する手間を減らす無料サービスです。', sections: [{ title: '目的', body: '一つのリンクから誰でも参加し、日付・時間・場所の希望を明確に共有できるようにします。' }, { title: '使い方', body: '主催者が候補を作成して共有し、投票結果を確認して最終予定を確定します。' }, { title: '大切にすること', body: '簡単な参加、分かりやすい結果、最小限のデータ、端末を問わない体験を重視します。' }] },
    contact: {
      title: 'お問い合わせ', intro: '使い方、不具合、プライバシー、改善提案についてメールでご連絡ください。', emailTitle: 'メール', emailBody: '不具合の場合はブラウザと発生した画面もお知らせください。', responseTitle: '回答について', responseBody: 'できるだけ早く確認します。プライバシーに関する依頼では本人確認をお願いする場合があります。',
    },
    privacy: { title: 'プライバシーポリシー', intro: 'Time2Gatherは日程調整に必要な情報のみを処理し、個人情報を販売しません。', sections: [{ title: '処理する情報', body: 'アカウント基本情報、予定、候補、投票、名前、セッションや接続情報を含む場合があります。' }, { title: '利用目的', body: '予定の作成・参加・確定、アカウント管理、セキュリティ、改善に利用します。' }, { title: '分析と外部事業者', body: 'Google Analyticsやホスティング・認証事業者が必要な範囲で処理する場合があります。' }, { title: '保存と権利', body: '必要な期間保存します。開示、訂正、削除はお問い合わせください。' }, { title: '国外処理', body: '事業者により国外で処理される場合があり、合理的な保護措置を講じます。' }] },
    terms: { title: '利用規約', intro: 'Time2Gatherを利用すると、以下の条件に同意したものとみなされます。', sections: [{ title: 'サービス利用', body: '法令と他者の権利を守って利用してください。' }, { title: '利用者の責任', body: '共有内容、リンク、アカウント、入力情報は利用者が管理します。' }, { title: '変更と提供状況', body: '品質と安全のため機能を変更または一時停止する場合があります。' }, { title: '権利と禁止事項', body: '無断複製、妨害、不正利用は禁止します。' }, { title: '責任の制限', body: 'サービスは提供可能な状態で提供され、法令の範囲内で責任を制限します。' }] },
    updated: '最終更新日：2026年10月14日', footer: 'みんなに合う時間を、もっと簡単に。',
  },
  'zh-CN': {
    metaTitle: 'Time2Gather - 找到适合所有人的时间',
    metaDescription: '免费的多人日程投票工具，可选择日期、时间和地点。参与者无需注册即可投票。',
    nav: {
      home: '首页', about: '关于', contact: '联系', privacy: '隐私', terms: '条款', language: '语言',
    },
    hero: {
      eyebrow: '在一个地方协调所有人的时间', title: '让多人约时间更简单', description: '分享日期和时间选项，收集空闲时间并确认最佳安排。参与者无需创建账户。', primary: '创建约会', secondary: '使用代码查找',
    },
    featuresTitle: '共同决定所需的一切',
    features: [{ title: '比较日期', body: '提出多个日期，一眼比较大家的可用情况。' }, { title: '投票选择时间', body: '收集具体时间，找到适合最多人的时段。' }, { title: '选择地点', body: '添加地点选项并收集大家的偏好。' }, { title: '无需注册', body: '参与者只需链接和昵称即可投票。' }],
    stepsTitle: '三步确定安排',
    steps: [{ title: '1. 创建选项', body: '填写活动名称、日期和时间。' }, { title: '2. 分享链接', body: '发送给朋友、同事或群组。' }, { title: '3. 确认安排', body: '查看投票并确定最佳时间。' }],
    faqTitle: '常见问题',
    faqs: [{ title: 'Time2Gather是什么？', body: '一款免费的日程投票工具，用于收集群组空闲时间并确定最佳安排。' }, { title: '参与者需要账户吗？', body: '不需要，输入昵称即可立即投票。' }, { title: '可以投票选择地点吗？', body: '可以，创建约会时开启地点投票并添加选项。' }],
    about: { title: '关于Time2Gather', intro: 'Time2Gather是一款免费的日程投票工具，旨在减少多人协调时反复沟通的麻烦。', sections: [{ title: '我们的目标', body: '让每个人都能通过一个链接参与，并清楚分享日期、时间和地点偏好。' }, { title: '使用方式', body: '发起人创建选项并分享链接，查看投票后确认最终安排。' }, { title: '我们重视什么', body: '便捷参与、清晰结果、最少数据收集以及跨设备的一致体验。' }] },
    contact: {
      title: '联系我们', intro: '如有使用问题、错误、隐私请求或建议，请发送邮件。', emailTitle: '电子邮件', emailBody: '报告问题时，请附上浏览器和出现问题的页面。', responseTitle: '回复', responseBody: '我们会尽快查看。隐私请求可能需要身份验证。',
    },
    privacy: { title: '隐私政策', intro: 'Time2Gather仅处理提供日程服务所需的信息，不出售个人信息。', sections: [{ title: '处理的信息', body: '可能包括账户基本信息、活动、选项、投票、昵称、会话和连接信息。' }, { title: '使用方式', body: '用于创建和确认活动、账户管理、安全、故障处理与改进。' }, { title: '分析和服务商', body: '我们可能使用Google Analytics，托管和认证服务商会处理必要信息。' }, { title: '保存和您的权利', body: '信息按需要保存。您可以联系我们申请访问、更正或删除。' }, { title: '跨境处理', body: '服务商可能在您所在国家之外处理信息，并采取合理保护措施。' }] },
    terms: { title: '服务条款', intro: '使用Time2Gather即表示您同意以下条款。', sections: [{ title: '使用服务', body: '请遵守法律并尊重他人权利。' }, { title: '您的责任', body: '您需对分享的内容、链接、账户和提交的信息负责。' }, { title: '变更和可用性', body: '为保证质量和安全，我们可能更改或暂停功能。' }, { title: '权利和限制', body: '不得复制、干扰或滥用服务。' }, { title: '责任限制', body: '服务按可用状态提供，责任在法律允许范围内受到限制。' }] },
    updated: '最后更新：2026年10月14日', footer: '轻松找到适合所有人的时间。',
  },
  'hi': {
    metaTitle: 'Time2Gather - सबके लिए सही समय खोजें',
    metaDescription: 'तारीख, समय और स्थान चुनने के लिए मुफ़्त समूह शेड्यूलिंग पोल। प्रतिभागी बिना अकाउंट वोट कर सकते हैं।',
    nav: {
      home: 'होम', about: 'हमारे बारे में', contact: 'संपर्क', privacy: 'गोपनीयता', terms: 'शर्तें', language: 'भाषा',
    },
    hero: {
      eyebrow: 'सबकी उपलब्धता एक जगह मिलाएँ', title: 'समूह का समय तय करना आसान बनाएँ', description: 'तारीख और समय के विकल्प साझा करें, उपलब्धता लें और सबसे अच्छा प्लान तय करें। वोट करने के लिए अकाउंट की जरूरत नहीं है।', primary: 'मीटिंग बनाएँ', secondary: 'कोड से खोजें',
    },
    featuresTitle: 'मिलकर तय करने के लिए सब कुछ',
    features: [{ title: 'तारीखें तुलना करें', body: 'कई तारीखें सुझाएँ और उपलब्धता तुरंत देखें।' }, { title: 'समय पर वोट करें', body: 'वह समय खोजें जो सबसे अधिक लोगों के लिए सही हो।' }, { title: 'स्थान चुनें', body: 'स्थान के विकल्प जोड़ें और पसंद जानें।' }, { title: 'बिना साइन-अप वोट', body: 'एक लिंक और नाम से तुरंत भाग लें।' }],
    stepsTitle: 'तीन चरणों में योजना तय करें',
    steps: [{ title: '1. विकल्प बनाएँ', body: 'नाम, तारीखें और समय जोड़ें।' }, { title: '2. लिंक साझा करें', body: 'दोस्तों, टीम या समूह को भेजें।' }, { title: '3. योजना पक्की करें', body: 'वोट देखकर सबसे अच्छा समय तय करें।' }],
    faqTitle: 'अक्सर पूछे जाने वाले सवाल',
    faqs: [{ title: 'Time2Gather क्या है?', body: 'समूह की उपलब्धता लेकर सही समय चुनने वाला मुफ़्त शेड्यूलिंग पोल।' }, { title: 'क्या अकाउंट जरूरी है?', body: 'नहीं। नाम डालकर तुरंत वोट किया जा सकता है।' }, { title: 'क्या स्थान पर वोट कर सकते हैं?', body: 'हाँ। मीटिंग बनाते समय स्थान वोटिंग चालू करें।' }],
    about: { title: 'Time2Gather के बारे में', intro: 'Time2Gather समूह का समय तय करने में बार-बार संदेश भेजने की जरूरत कम करने वाला मुफ़्त टूल है।', sections: [{ title: 'हमारा उद्देश्य', body: 'एक लिंक से सबको शामिल करना और उपलब्धता साफ़ तरीके से साझा करना।' }, { title: 'यह कैसे काम करता है', body: 'होस्ट विकल्प बनाता है, लिंक साझा करता है, वोट देखता है और अंतिम योजना तय करता है।' }, { title: 'हमारी प्राथमिकताएँ', body: 'आसान भागीदारी, साफ़ परिणाम, कम डेटा और सभी डिवाइस पर अच्छा अनुभव।' }] },
    contact: {
      title: 'संपर्क करें', intro: 'सेवा, समस्या, गोपनीयता या सुझाव के लिए हमें ईमेल करें।', emailTitle: 'ईमेल', emailBody: 'समस्या बताते समय ब्राउज़र और संबंधित स्क्रीन भी बताएँ।', responseTitle: 'जवाब', responseBody: 'हम जल्द से जल्द संदेश देखते हैं। गोपनीयता अनुरोध में पहचान सत्यापन हो सकता है।',
    },
    privacy: { title: 'गोपनीयता नीति', intro: 'Time2Gather केवल जरूरी जानकारी संसाधित करता है और व्यक्तिगत जानकारी नहीं बेचता।', sections: [{ title: 'हम कौन-सी जानकारी लेते हैं', body: 'अकाउंट विवरण, मीटिंग, विकल्प, वोट, नाम, सेशन और कनेक्शन जानकारी शामिल हो सकती है।' }, { title: 'जानकारी का उपयोग', body: 'सेवा देने, अकाउंट संभालने, सुरक्षा और सुधार के लिए।' }, { title: 'एनालिटिक्स और प्रदाता', body: 'Google Analytics और तकनीकी प्रदाता जरूरी जानकारी संसाधित कर सकते हैं।' }, { title: 'रखने की अवधि और विकल्प', body: 'जानकारी जरूरत तक रखी जाती है। एक्सेस, सुधार या हटाने के लिए संपर्क करें।' }, { title: 'अंतरराष्ट्रीय संसाधन', body: 'प्रदाता उचित सुरक्षा के साथ आपके देश के बाहर जानकारी संसाधित कर सकते हैं।' }] },
    terms: { title: 'सेवा की शर्तें', intro: 'Time2Gather का उपयोग करके आप इन शर्तों से सहमत होते हैं।', sections: [{ title: 'सेवा का उपयोग', body: 'कानून का पालन करें और दूसरों के अधिकारों का सम्मान करें।' }, { title: 'आपकी जिम्मेदारी', body: 'साझा सामग्री, लिंक, अकाउंट और दी गई जानकारी के लिए आप जिम्मेदार हैं।' }, { title: 'बदलाव और उपलब्धता', body: 'गुणवत्ता और सुरक्षा के लिए सुविधाएँ बदली या रोकी जा सकती हैं।' }, { title: 'अधिकार और प्रतिबंध', body: 'सेवा की नकल, बाधा या दुरुपयोग की अनुमति नहीं है।' }, { title: 'दायित्व सीमा', body: 'सेवा उपलब्धता के अनुसार दी जाती है और दायित्व कानून की सीमा तक सीमित है।' }] },
    updated: 'अंतिम अपडेट: 14 अक्टूबर 2026', footer: 'ऐसा समय खोजें जो सबके लिए सही हो।',
  },
  'ar': {
    metaTitle: 'Time2Gather - اعثر على وقت يناسب الجميع',
    metaDescription: 'استطلاع مجاني لتنسيق التاريخ والوقت والمكان. يمكن للمشاركين التصويت دون إنشاء حساب.',
    nav: {
      home: 'الرئيسية', about: 'من نحن', contact: 'تواصل معنا', privacy: 'الخصوصية', terms: 'الشروط', language: 'اللغة',
    },
    hero: {
      eyebrow: 'نسّق مواعيد الجميع في مكان واحد', title: 'اجعل تنسيق المواعيد الجماعية بسيطًا', description: 'شارك خيارات التاريخ والوقت، واجمع أوقات التفرغ، ثم أكّد أفضل خطة. لا يحتاج المشاركون إلى حساب للتصويت.', primary: 'إنشاء موعد', secondary: 'البحث برمز',
    },
    featuresTitle: 'كل ما تحتاجه لاتخاذ القرار معًا',
    features: [{ title: 'قارن التواريخ', body: 'اقترح عدة تواريخ وقارن أوقات التفرغ بسرعة.' }, { title: 'صوّت على الأوقات', body: 'اعثر على الوقت المناسب لأكبر عدد من الأشخاص.' }, { title: 'اختر المكان', body: 'أضف خيارات الأماكن واجمع تفضيلات المجموعة.' }, { title: 'تصويت بلا تسجيل', body: 'يمكن المشاركة فورًا برابط واسم فقط.' }],
    stepsTitle: 'حدّد الخطة في ثلاث خطوات',
    steps: [{ title: '1. أنشئ الخيارات', body: 'أدخل اسم الموعد والتواريخ والأوقات.' }, { title: '2. شارك الرابط', body: 'أرسله إلى الأصدقاء أو الزملاء أو المجموعة.' }, { title: '3. أكّد الخطة', body: 'راجع الأصوات وحدد أفضل وقت.' }],
    faqTitle: 'الأسئلة الشائعة',
    faqs: [{ title: 'ما هو Time2Gather؟', body: 'استطلاع مجاني يجمع أوقات تفرغ المجموعة لاختيار أفضل موعد.' }, { title: 'هل يحتاج المشاركون إلى حساب؟', body: 'لا. يكفي إدخال اسم والتصويت مباشرة.' }, { title: 'هل يمكن التصويت على المكان؟', body: 'نعم. فعّل تصويت المكان وأضف الخيارات.' }],
    about: { title: 'عن Time2Gather', intro: 'Time2Gather أداة مجانية تقلل الرسائل المتكررة عند تنسيق موعد جماعي.', sections: [{ title: 'هدفنا', body: 'تمكين الجميع من المشاركة عبر رابط واحد ومشاركة أوقات التفرغ بوضوح.' }, { title: 'كيف يعمل', body: 'ينشئ المضيف الخيارات ويشارك الرابط، ثم يراجع الأصوات ويؤكد الخطة.' }, { title: 'ما نهتم به', body: 'سهولة المشاركة ووضوح النتائج وتقليل البيانات وتجربة متسقة.' }] },
    contact: {
      title: 'تواصل معنا', intro: 'راسلنا بشأن استخدام الخدمة أو مشكلة أو طلب خصوصية أو اقتراح.', emailTitle: 'البريد الإلكتروني', emailBody: 'عند الإبلاغ عن مشكلة، اذكر المتصفح والصفحة التي ظهرت فيها.', responseTitle: 'الردود', responseBody: 'نراجع الرسائل بأسرع ما يمكن، وقد يتطلب طلب الخصوصية التحقق من الهوية.',
    },
    privacy: { title: 'سياسة الخصوصية', intro: 'يعالج Time2Gather المعلومات اللازمة للتنسيق فقط ولا يبيع المعلومات الشخصية.', sections: [{ title: 'المعلومات التي نعالجها', body: 'قد تشمل بيانات الحساب الأساسية والمواعيد والخيارات والأصوات والأسماء وبيانات الجلسة والاتصال.' }, { title: 'كيفية الاستخدام', body: 'نستخدمها لتقديم الخدمة وإدارة الحسابات والحماية والتحسين.' }, { title: 'التحليلات ومقدمو الخدمة', body: 'قد نستخدم Google Analytics، وقد يعالج مقدمو الاستضافة والمصادقة المعلومات اللازمة.' }, { title: 'الاحتفاظ وخياراتك', body: 'نحتفظ بالمعلومات حسب الحاجة. تواصل معنا لطلب الوصول أو التصحيح أو الحذف.' }, { title: 'المعالجة الدولية', body: 'قد يعالج مقدمو الخدمة المعلومات خارج بلدك مع تطبيق ضمانات معقولة.' }] },
    terms: { title: 'شروط الخدمة', intro: 'باستخدام Time2Gather فإنك توافق على هذه الشروط.', sections: [{ title: 'استخدام الخدمة', body: 'استخدم الخدمة قانونيًا واحترم حقوق الآخرين.' }, { title: 'مسؤولياتك', body: 'أنت مسؤول عن المحتوى والروابط والحساب والمعلومات التي ترسلها.' }, { title: 'التغييرات والتوفر', body: 'قد نغيّر الميزات أو نوقفها مؤقتًا للحفاظ على الجودة والأمان.' }, { title: 'الحقوق والقيود', body: 'لا يُسمح بنسخ الخدمة أو تعطيلها أو إساءة استخدامها.' }, { title: 'حدود المسؤولية', body: 'تُقدّم الخدمة حسب توفرها وتُحد المسؤولية بالقدر الذي يسمح به القانون.' }] },
    updated: 'آخر تحديث: 14 أكتوبر 2026', footer: 'اعثر على وقت يناسب الجميع.',
  },
  'id': {
    metaTitle: 'Time2Gather - Temukan waktu yang cocok untuk semua',
    metaDescription: 'Polling jadwal gratis untuk memilih tanggal, waktu, dan lokasi. Peserta dapat memilih tanpa membuat akun.',
    nav: {
      home: 'Beranda', about: 'Tentang', contact: 'Kontak', privacy: 'Privasi', terms: 'Ketentuan', language: 'Bahasa',
    },
    hero: {
      eyebrow: 'Koordinasikan semua orang di satu tempat', title: 'Atur jadwal kelompok dengan mudah', description: 'Bagikan pilihan tanggal dan waktu, kumpulkan ketersediaan, lalu tetapkan rencana terbaik. Peserta tidak perlu membuat akun.', primary: 'Buat pertemuan', secondary: 'Cari dengan kode',
    },
    featuresTitle: 'Semua yang dibutuhkan untuk memutuskan bersama',
    features: [{ title: 'Bandingkan tanggal', body: 'Usulkan beberapa tanggal dan lihat ketersediaan dengan cepat.' }, { title: 'Pilih slot waktu', body: 'Temukan waktu yang cocok untuk paling banyak orang.' }, { title: 'Tentukan lokasi', body: 'Tambahkan pilihan lokasi dan kumpulkan preferensi.' }, { title: 'Tanpa daftar akun', body: 'Peserta cukup membuka tautan dan memasukkan nama.' }],
    stepsTitle: 'Selesaikan dalam tiga langkah',
    steps: [{ title: '1. Buat pilihan', body: 'Masukkan nama, tanggal, dan waktu.' }, { title: '2. Bagikan tautan', body: 'Kirim ke teman, rekan, atau kelompok.' }, { title: '3. Tetapkan rencana', body: 'Tinjau suara dan pilih waktu terbaik.' }],
    faqTitle: 'Pertanyaan umum',
    faqs: [{ title: 'Apa itu Time2Gather?', body: 'Polling gratis untuk mengumpulkan ketersediaan kelompok dan memilih waktu terbaik.' }, { title: 'Apakah peserta perlu akun?', body: 'Tidak. Masukkan nama lalu langsung memilih.' }, { title: 'Bisakah memilih lokasi?', body: 'Bisa. Aktifkan polling lokasi dan tambahkan pilihannya.' }],
    about: { title: 'Tentang Time2Gather', intro: 'Time2Gather adalah alat gratis untuk mengurangi percakapan berulang saat mengatur jadwal kelompok.', sections: [{ title: 'Tujuan kami', body: 'Memudahkan semua orang bergabung dari satu tautan dan membagikan ketersediaan dengan jelas.' }, { title: 'Cara kerja', body: 'Pengelola membuat pilihan, membagikan tautan, meninjau suara, dan menetapkan rencana.' }, { title: 'Yang kami utamakan', body: 'Partisipasi mudah, hasil jelas, data minimal, dan pengalaman yang konsisten.' }] },
    contact: {
      title: 'Hubungi kami', intro: 'Kirim email tentang layanan, masalah, privasi, atau saran.', emailTitle: 'Email', emailBody: 'Saat melaporkan masalah, sertakan browser dan halaman tempat masalah terjadi.', responseTitle: 'Tanggapan', responseBody: 'Kami meninjau pesan secepat mungkin. Permintaan privasi mungkin memerlukan verifikasi.',
    },
    privacy: { title: 'Kebijakan Privasi', intro: 'Time2Gather hanya memproses informasi yang diperlukan dan tidak menjual informasi pribadi.', sections: [{ title: 'Informasi yang diproses', body: 'Dapat mencakup akun, pertemuan, pilihan, suara, nama, sesi, dan informasi koneksi.' }, { title: 'Cara penggunaan', body: 'Digunakan untuk menyediakan layanan, mengelola akun, menjaga keamanan, dan meningkatkan produk.' }, { title: 'Analitik dan penyedia', body: 'Kami dapat memakai Google Analytics. Penyedia hosting dan autentikasi memproses data yang diperlukan.' }, { title: 'Penyimpanan dan pilihan', body: 'Informasi disimpan selama diperlukan. Hubungi kami untuk akses, koreksi, atau penghapusan.' }, { title: 'Pemrosesan internasional', body: 'Penyedia dapat memproses informasi di luar negara Anda dengan perlindungan yang wajar.' }] },
    terms: { title: 'Ketentuan Layanan', intro: 'Dengan menggunakan Time2Gather, Anda menyetujui ketentuan ini.', sections: [{ title: 'Penggunaan layanan', body: 'Gunakan secara legal dan hormati hak orang lain.' }, { title: 'Tanggung jawab Anda', body: 'Anda bertanggung jawab atas konten, tautan, akun, dan informasi yang dikirim.' }, { title: 'Perubahan dan ketersediaan', body: 'Fitur dapat diubah atau dijeda demi kualitas dan keamanan.' }, { title: 'Hak dan batasan', body: 'Dilarang menyalin, mengganggu, atau menyalahgunakan layanan.' }, { title: 'Batas tanggung jawab', body: 'Layanan tersedia sebagaimana adanya dan tanggung jawab dibatasi sesuai hukum.' }] },
    updated: 'Terakhir diperbarui: 14 Oktober 2026', footer: 'Temukan waktu yang cocok untuk semua.',
  },
  'tr': {
    metaTitle: 'Time2Gather - Herkese uyan zamanı bulun',
    metaDescription: 'Tarih, saat ve yer seçmek için ücretsiz grup planlama anketi. Katılımcılar hesap açmadan oy verebilir.',
    nav: {
      home: 'Ana sayfa', about: 'Hakkımızda', contact: 'İletişim', privacy: 'Gizlilik', terms: 'Koşullar', language: 'Dil',
    },
    hero: {
      eyebrow: 'Herkesin programını tek yerde koordine edin', title: 'Grup planlamasını kolaylaştırın', description: 'Tarih ve saat seçeneklerini paylaşın, uygunlukları toplayın ve en iyi planı kesinleştirin. Oy vermek için hesap gerekmez.', primary: 'Toplantı oluştur', secondary: 'Kodla bul',
    },
    featuresTitle: 'Birlikte karar vermek için gerekenler',
    features: [{ title: 'Tarihleri karşılaştırın', body: 'Birden fazla tarih önerin ve uygunlukları hızlıca görün.' }, { title: 'Saatlere oy verin', body: 'En çok kişiye uyan zamanı bulun.' }, { title: 'Yer seçin', body: 'Yer seçenekleri ekleyin ve tercihleri toplayın.' }, { title: 'Kayıt olmadan oy', body: 'Bir bağlantı ve isimle hemen katılın.' }],
    stepsTitle: 'Üç adımda planlayın',
    steps: [{ title: '1. Seçenek oluşturun', body: 'Adı, tarihleri ve saatleri girin.' }, { title: '2. Bağlantıyı paylaşın', body: 'Arkadaşlarınıza, ekibinize veya grubunuza gönderin.' }, { title: '3. Planı kesinleştirin', body: 'Oyları inceleyip en iyi zamanı seçin.' }],
    faqTitle: 'Sık sorulan sorular',
    faqs: [{ title: 'Time2Gather nedir?', body: 'Grup uygunluklarını toplayıp en iyi zamanı seçen ücretsiz bir planlama anketidir.' }, { title: 'Hesap gerekli mi?', body: 'Hayır. İsim girip hemen oy verilebilir.' }, { title: 'Yer için oy verilebilir mi?', body: 'Evet. Yer oylamasını açıp seçenekleri ekleyin.' }],
    about: { title: 'Time2Gather hakkında', intro: 'Time2Gather, grup planlarken tekrarlanan mesajları azaltmak için geliştirilmiş ücretsiz bir araçtır.', sections: [{ title: 'Amacımız', body: 'Herkesin tek bağlantıyla katılıp uygunluğunu açıkça paylaşmasını sağlamak.' }, { title: 'Nasıl çalışır', body: 'Düzenleyen kişi seçenekleri oluşturur, bağlantıyı paylaşır, oyları inceler ve planı onaylar.' }, { title: 'Önceliklerimiz', body: 'Kolay katılım, net sonuçlar, az veri ve tutarlı deneyim.' }] },
    contact: {
      title: 'İletişim', intro: 'Hizmet, hata, gizlilik veya öneriler için bize e-posta gönderin.', emailTitle: 'E-posta', emailBody: 'Sorun bildirirken tarayıcıyı ve sorunun olduğu ekranı belirtin.', responseTitle: 'Yanıtlar', responseBody: 'Mesajları mümkün olan en kısa sürede inceleriz. Gizlilik taleplerinde kimlik doğrulaması gerekebilir.',
    },
    privacy: { title: 'Gizlilik Politikası', intro: 'Time2Gather yalnızca gerekli bilgileri işler ve kişisel bilgileri satmaz.', sections: [{ title: 'İşlenen bilgiler', body: 'Hesap, toplantı, seçenek, oy, isim, oturum ve bağlantı bilgileri içerebilir.' }, { title: 'Kullanım', body: 'Hizmeti sunmak, hesapları yönetmek, güvenliği sağlamak ve geliştirmek için kullanılır.' }, { title: 'Analiz ve sağlayıcılar', body: 'Google Analytics ile barındırma ve kimlik sağlayıcıları gerekli bilgileri işleyebilir.' }, { title: 'Saklama ve seçimleriniz', body: 'Bilgiler gerektiği sürece tutulur. Erişim, düzeltme veya silme için iletişime geçin.' }, { title: 'Uluslararası işleme', body: 'Sağlayıcılar bilgileri makul önlemlerle ülkeniz dışında işleyebilir.' }] },
    terms: { title: 'Hizmet Koşulları', intro: 'Time2Gather kullanarak bu koşulları kabul edersiniz.', sections: [{ title: 'Hizmeti kullanma', body: 'Yasalara uyun ve başkalarının haklarına saygı gösterin.' }, { title: 'Sorumluluklarınız', body: 'İçerik, bağlantılar, hesap ve gönderdiğiniz bilgilerden siz sorumlusunuz.' }, { title: 'Değişiklik ve kullanılabilirlik', body: 'Kalite ve güvenlik için özellikler değiştirilebilir veya durdurulabilir.' }, { title: 'Haklar ve kısıtlamalar', body: 'Hizmeti kopyalamak, bozmak veya kötüye kullanmak yasaktır.' }, { title: 'Sorumluluk sınırı', body: 'Hizmet mevcut haliyle sunulur ve sorumluluk yasaların izin verdiği ölçüde sınırlıdır.' }] },
    updated: 'Son güncelleme: 14 Ekim 2026', footer: 'Herkese uyan zamanı bulun.',
  },
  'vi': {
    metaTitle: 'Time2Gather - Tìm thời gian phù hợp cho mọi người',
    metaDescription: 'Bình chọn lịch miễn phí cho ngày, giờ và địa điểm. Người tham gia không cần tạo tài khoản.',
    nav: {
      home: 'Trang chủ', about: 'Giới thiệu', contact: 'Liên hệ', privacy: 'Quyền riêng tư', terms: 'Điều khoản', language: 'Ngôn ngữ',
    },
    hero: {
      eyebrow: 'Điều phối lịch của mọi người tại một nơi', title: 'Lên lịch nhóm thật đơn giản', description: 'Chia sẻ các lựa chọn ngày giờ, thu thập thời gian rảnh và xác nhận kế hoạch tốt nhất. Không cần tài khoản để bình chọn.', primary: 'Tạo cuộc hẹn', secondary: 'Tìm bằng mã',
    },
    featuresTitle: 'Mọi thứ để cùng nhau quyết định',
    features: [{ title: 'So sánh ngày', body: 'Đề xuất nhiều ngày và xem nhanh thời gian rảnh.' }, { title: 'Bình chọn khung giờ', body: 'Tìm thời gian phù hợp với nhiều người nhất.' }, { title: 'Chọn địa điểm', body: 'Thêm địa điểm và thu thập lựa chọn của nhóm.' }, { title: 'Không cần đăng ký', body: 'Chỉ cần liên kết và tên để tham gia.' }],
    stepsTitle: 'Ba bước để chốt lịch',
    steps: [{ title: '1. Tạo lựa chọn', body: 'Nhập tên, ngày và giờ.' }, { title: '2. Chia sẻ liên kết', body: 'Gửi cho bạn bè, đồng nghiệp hoặc nhóm.' }, { title: '3. Xác nhận kế hoạch', body: 'Xem kết quả và chọn thời gian tốt nhất.' }],
    faqTitle: 'Câu hỏi thường gặp',
    faqs: [{ title: 'Time2Gather là gì?', body: 'Công cụ bình chọn miễn phí để thu thập thời gian rảnh và chọn lịch tốt nhất.' }, { title: 'Có cần tài khoản không?', body: 'Không. Nhập tên và bình chọn ngay.' }, { title: 'Có thể bình chọn địa điểm không?', body: 'Có. Bật bình chọn địa điểm và thêm các lựa chọn.' }],
    about: { title: 'Về Time2Gather', intro: 'Time2Gather là công cụ miễn phí giúp giảm việc nhắn tin qua lại khi lên lịch nhóm.', sections: [{ title: 'Mục đích', body: 'Giúp mọi người tham gia bằng một liên kết và chia sẻ thời gian rảnh rõ ràng.' }, { title: 'Cách hoạt động', body: 'Người tổ chức tạo lựa chọn, chia sẻ liên kết, xem bình chọn và xác nhận kế hoạch.' }, { title: 'Điều chúng tôi coi trọng', body: 'Dễ tham gia, kết quả rõ ràng, ít dữ liệu và trải nghiệm nhất quán.' }] },
    contact: {
      title: 'Liên hệ', intro: 'Gửi email cho chúng tôi về dịch vụ, lỗi, quyền riêng tư hoặc góp ý.', emailTitle: 'Email', emailBody: 'Khi báo lỗi, hãy cho biết trình duyệt và màn hình gặp vấn đề.', responseTitle: 'Phản hồi', responseBody: 'Chúng tôi xem xét sớm nhất có thể. Yêu cầu riêng tư có thể cần xác minh danh tính.',
    },
    privacy: { title: 'Chính sách quyền riêng tư', intro: 'Time2Gather chỉ xử lý thông tin cần thiết và không bán thông tin cá nhân.', sections: [{ title: 'Thông tin xử lý', body: 'Có thể gồm tài khoản, cuộc hẹn, lựa chọn, bình chọn, tên, phiên và kết nối.' }, { title: 'Cách sử dụng', body: 'Dùng để cung cấp dịch vụ, quản lý tài khoản, bảo mật và cải thiện sản phẩm.' }, { title: 'Phân tích và nhà cung cấp', body: 'Google Analytics và nhà cung cấp kỹ thuật có thể xử lý thông tin cần thiết.' }, { title: 'Lưu trữ và lựa chọn', body: 'Dữ liệu được giữ khi cần. Hãy liên hệ để yêu cầu truy cập, sửa hoặc xóa.' }, { title: 'Xử lý quốc tế', body: 'Nhà cung cấp có thể xử lý dữ liệu ngoài quốc gia của bạn với biện pháp hợp lý.' }] },
    terms: { title: 'Điều khoản dịch vụ', intro: 'Khi dùng Time2Gather, bạn đồng ý với các điều khoản này.', sections: [{ title: 'Sử dụng dịch vụ', body: 'Tuân thủ pháp luật và tôn trọng quyền của người khác.' }, { title: 'Trách nhiệm của bạn', body: 'Bạn chịu trách nhiệm về nội dung, liên kết, tài khoản và thông tin gửi lên.' }, { title: 'Thay đổi và khả dụng', body: 'Tính năng có thể thay đổi hoặc tạm dừng để đảm bảo chất lượng và an toàn.' }, { title: 'Quyền và hạn chế', body: 'Không được sao chép, gây gián đoạn hoặc lạm dụng dịch vụ.' }, { title: 'Giới hạn trách nhiệm', body: 'Dịch vụ được cung cấp theo khả năng sẵn có và giới hạn theo pháp luật.' }] },
    updated: 'Cập nhật lần cuối: 14 tháng 10 năm 2026', footer: 'Tìm thời gian phù hợp cho mọi người.',
  },
  'th': {
    metaTitle: 'Time2Gather - หาเวลาที่เหมาะกับทุกคน',
    metaDescription: 'โพลจัดตารางฟรีสำหรับวัน เวลา และสถานที่ ผู้เข้าร่วมโหวตได้โดยไม่ต้องสร้างบัญชี',
    nav: {
      home: 'หน้าแรก', about: 'เกี่ยวกับเรา', contact: 'ติดต่อ', privacy: 'ความเป็นส่วนตัว', terms: 'ข้อกำหนด', language: 'ภาษา',
    },
    hero: {
      eyebrow: 'จัดตารางของทุกคนไว้ในที่เดียว', title: 'นัดหมายกลุ่มให้ง่ายขึ้น', description: 'แชร์ตัวเลือกวันและเวลา รวบรวมเวลาว่าง แล้วสรุปแผนที่ดีที่สุด ผู้เข้าร่วมไม่ต้องสร้างบัญชี', primary: 'สร้างนัดหมาย', secondary: 'ค้นหาด้วยรหัส',
    },
    featuresTitle: 'ทุกอย่างที่ต้องใช้เพื่อตัดสินใจร่วมกัน',
    features: [{ title: 'เปรียบเทียบวันที่', body: 'เสนอหลายวันและดูเวลาที่ทุกคนสะดวกได้ทันที' }, { title: 'โหวตช่วงเวลา', body: 'หาเวลาที่เหมาะกับคนจำนวนมากที่สุด' }, { title: 'เลือกสถานที่', body: 'เพิ่มตัวเลือกสถานที่และรวบรวมความเห็น' }, { title: 'โหวตโดยไม่สมัคร', body: 'ใช้เพียงลิงก์และชื่อก็เข้าร่วมได้' }],
    stepsTitle: 'สรุปแผนในสามขั้นตอน',
    steps: [{ title: '1. สร้างตัวเลือก', body: 'ใส่ชื่อ วันที่ และเวลา' }, { title: '2. แชร์ลิงก์', body: 'ส่งให้เพื่อน ทีม หรือกลุ่ม' }, { title: '3. ยืนยันแผน', body: 'ดูผลโหวตและเลือกเวลาที่ดีที่สุด' }],
    faqTitle: 'คำถามที่พบบ่อย',
    faqs: [{ title: 'Time2Gather คืออะไร?', body: 'โพลฟรีสำหรับรวบรวมเวลาว่างของกลุ่มและเลือกเวลาที่ดีที่สุด' }, { title: 'ต้องมีบัญชีหรือไม่?', body: 'ไม่ต้อง ใส่ชื่อแล้วโหวตได้ทันที' }, { title: 'โหวตสถานที่ได้ไหม?', body: 'ได้ เปิดโหวตสถานที่และเพิ่มตัวเลือก' }],
    about: { title: 'เกี่ยวกับ Time2Gather', intro: 'Time2Gather เป็นเครื่องมือฟรีที่ช่วยลดการส่งข้อความซ้ำเมื่อต้องนัดหมายกลุ่ม', sections: [{ title: 'เป้าหมายของเรา', body: 'ให้ทุกคนเข้าร่วมผ่านลิงก์เดียวและแจ้งเวลาว่างได้ชัดเจน' }, { title: 'วิธีทำงาน', body: 'ผู้จัดสร้างตัวเลือก แชร์ลิงก์ ดูผลโหวต และยืนยันแผน' }, { title: 'สิ่งที่เราให้ความสำคัญ', body: 'เข้าร่วมง่าย ผลลัพธ์ชัดเจน เก็บข้อมูลน้อย และใช้งานสม่ำเสมอ' }] },
    contact: {
      title: 'ติดต่อเรา', intro: 'ส่งอีเมลเกี่ยวกับการใช้งาน ปัญหา ความเป็นส่วนตัว หรือข้อเสนอแนะ', emailTitle: 'อีเมล', emailBody: 'เมื่อแจ้งปัญหา โปรดระบุเบราว์เซอร์และหน้าที่เกิดปัญหา', responseTitle: 'การตอบกลับ', responseBody: 'เราจะตรวจสอบโดยเร็ว คำขอด้านความเป็นส่วนตัวอาจต้องยืนยันตัวตน',
    },
    privacy: { title: 'นโยบายความเป็นส่วนตัว', intro: 'Time2Gather ประมวลผลเฉพาะข้อมูลที่จำเป็นและไม่ขายข้อมูลส่วนบุคคล', sections: [{ title: 'ข้อมูลที่ประมวลผล', body: 'อาจรวมข้อมูลบัญชี นัดหมาย ตัวเลือก โหวต ชื่อ เซสชัน และการเชื่อมต่อ' }, { title: 'การใช้ข้อมูล', body: 'ใช้เพื่อให้บริการ จัดการบัญชี รักษาความปลอดภัย และปรับปรุงผลิตภัณฑ์' }, { title: 'การวิเคราะห์และผู้ให้บริการ', body: 'Google Analytics และผู้ให้บริการทางเทคนิคอาจประมวลผลข้อมูลที่จำเป็น' }, { title: 'การเก็บรักษาและสิทธิ', body: 'เก็บข้อมูลเท่าที่จำเป็น ติดต่อเราเพื่อขอเข้าถึง แก้ไข หรือลบ' }, { title: 'การประมวลผลระหว่างประเทศ', body: 'ผู้ให้บริการอาจประมวลผลข้อมูลนอกประเทศโดยมีมาตรการที่เหมาะสม' }] },
    terms: { title: 'ข้อกำหนดการใช้บริการ', intro: 'เมื่อใช้ Time2Gather คุณยอมรับข้อกำหนดเหล่านี้', sections: [{ title: 'การใช้บริการ', body: 'ใช้บริการอย่างถูกกฎหมายและเคารพสิทธิผู้อื่น' }, { title: 'ความรับผิดชอบของคุณ', body: 'คุณรับผิดชอบเนื้อหา ลิงก์ บัญชี และข้อมูลที่ส่ง' }, { title: 'การเปลี่ยนแปลงและความพร้อม', body: 'เราอาจเปลี่ยนหรือหยุดฟีเจอร์ชั่วคราวเพื่อคุณภาพและความปลอดภัย' }, { title: 'สิทธิและข้อจำกัด', body: 'ห้ามคัดลอก รบกวน หรือใช้บริการในทางที่ผิด' }, { title: 'ขอบเขตความรับผิด', body: 'บริการมีให้ตามสภาพและจำกัดความรับผิดตามกฎหมาย' }] },
    updated: 'อัปเดตล่าสุด: 14 ตุลาคม 2026', footer: 'หาเวลาที่เหมาะกับทุกคนได้ง่ายขึ้น',
  },
  'ru': {
    metaTitle: 'Time2Gather - Найдите время, удобное всем',
    metaDescription: 'Бесплатный опрос для выбора даты, времени и места. Участники голосуют без регистрации.',
    nav: {
      home: 'Главная', about: 'О сервисе', contact: 'Контакты', privacy: 'Конфиденциальность', terms: 'Условия', language: 'Язык',
    },
    hero: {
      eyebrow: 'Согласуйте расписание в одном месте', title: 'Планировать встречу вместе — просто', description: 'Поделитесь вариантами дат и времени, соберите доступность и подтвердите лучший план. Для голосования не нужен аккаунт.', primary: 'Создать встречу', secondary: 'Найти по коду',
    },
    featuresTitle: 'Всё для совместного решения',
    features: [{ title: 'Сравните даты', body: 'Предложите несколько дат и сразу сравните доступность.' }, { title: 'Голосуйте за время', body: 'Найдите время, подходящее большинству.' }, { title: 'Выберите место', body: 'Добавьте варианты мест и соберите предпочтения.' }, { title: 'Без регистрации', body: 'Для участия достаточно ссылки и имени.' }],
    stepsTitle: 'Три шага до готового плана',
    steps: [{ title: '1. Создайте варианты', body: 'Укажите название, даты и время.' }, { title: '2. Поделитесь ссылкой', body: 'Отправьте друзьям, коллегам или группе.' }, { title: '3. Подтвердите план', body: 'Посмотрите результаты и выберите лучшее время.' }],
    faqTitle: 'Частые вопросы',
    faqs: [{ title: 'Что такое Time2Gather?', body: 'Бесплатный опрос, который собирает доступность группы и помогает выбрать время.' }, { title: 'Нужен ли аккаунт?', body: 'Нет. Укажите имя и голосуйте сразу.' }, { title: 'Можно голосовать за место?', body: 'Да. Включите голосование за место и добавьте варианты.' }],
    about: { title: 'О Time2Gather', intro: 'Time2Gather — бесплатный инструмент, который сокращает переписку при планировании групповых встреч.', sections: [{ title: 'Наша цель', body: 'Дать каждому возможность присоединиться по одной ссылке и понятно указать доступность.' }, { title: 'Как это работает', body: 'Организатор создаёт варианты, делится ссылкой, смотрит голоса и подтверждает план.' }, { title: 'Наши принципы', body: 'Простое участие, понятный результат, минимум данных и единый опыт.' }] },
    contact: {
      title: 'Связаться с нами', intro: 'Напишите нам о сервисе, ошибке, конфиденциальности или предложении.', emailTitle: 'Электронная почта', emailBody: 'При сообщении об ошибке укажите браузер и страницу, где она возникла.', responseTitle: 'Ответы', responseBody: 'Мы рассматриваем сообщения как можно быстрее. Для запросов о данных может потребоваться подтверждение личности.',
    },
    privacy: { title: 'Политика конфиденциальности', intro: 'Time2Gather обрабатывает только необходимые данные и не продаёт персональную информацию.', sections: [{ title: 'Какие данные обрабатываются', body: 'Возможны данные аккаунта, встреч, вариантов, голосов, имён, сессий и подключения.' }, { title: 'Как мы используем данные', body: 'Для работы сервиса, управления аккаунтами, безопасности и улучшений.' }, { title: 'Аналитика и поставщики', body: 'Google Analytics и технические поставщики могут обрабатывать необходимые данные.' }, { title: 'Хранение и ваши права', body: 'Данные хранятся по необходимости. Можно запросить доступ, исправление или удаление.' }, { title: 'Международная обработка', body: 'Поставщики могут обрабатывать данные за пределами вашей страны с разумными мерами защиты.' }] },
    terms: { title: 'Условия использования', intro: 'Используя Time2Gather, вы соглашаетесь с этими условиями.', sections: [{ title: 'Использование сервиса', body: 'Соблюдайте закон и уважайте права других.' }, { title: 'Ваша ответственность', body: 'Вы отвечаете за контент, ссылки, аккаунт и отправленные данные.' }, { title: 'Изменения и доступность', body: 'Функции могут изменяться или приостанавливаться ради качества и безопасности.' }, { title: 'Права и ограничения', body: 'Запрещено копировать, нарушать работу или злоупотреблять сервисом.' }, { title: 'Ограничение ответственности', body: 'Сервис предоставляется по мере доступности, ответственность ограничена законом.' }] },
    updated: 'Последнее обновление: 14 октября 2026 г.', footer: 'Найдите время, удобное всем.',
  },
}
