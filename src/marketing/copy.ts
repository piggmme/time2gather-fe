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
    noLogin: string
  }
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

const existingMarketingCopy: Partial<Record<MarketingLocale, MarketingCopy>> = {
  'ko': {
    metaTitle: '약속 잡기와 일정 투표 | Time2Gather',
    metaDescription: '가능한 날짜와 시간을 투표로 모으는 무료 약속 잡기 사이트. 회원가입 없이 링크로 공유하고 일정을 정하세요.',
    nav: {
      home: '홈', about: '소개', contact: '문의', privacy: '개인정보', terms: '이용약관', language: '언어',
    },
    hero: {
      noLogin: '로그인 없이 바로 시작하세요.',
      eyebrow: '여럿이 만날 땐, 타임투게더',
      title: '우리 모두 되는 시간',
      description: '가능한 시간을 모아, 약속을 정해요.',
      primary: '약속 만들기',
      secondary: '초대 코드 입력',
    },
    stepsTitle: '약속 잡기, 세 단계면 충분해요',
    steps: [
      { title: '1. 후보 만들기', body: '가능한 날짜와 시간을 올려요.' },
      { title: '2. 링크 공유하기', body: '함께할 사람에게 링크를 보내요.' },
      { title: '3. 일정 확정하기', body: '투표 결과에서 가장 좋은 일정을 골라요.' },
    ],
    faqTitle: '자주 묻는 질문',
    faqs: [
      { title: '친구 모임이나 팀 회의, 여러 사람의 일정을 어떻게 맞추나요?', body: 'Time2Gather에서 날짜와 시간 후보를 만들고 링크를 공유하세요. 각자 가능한 일정을 선택하면 결과를 비교해 최종 일정을 확정할 수 있습니다. 친구 모임, 스터디, 팀 회의에 무료로 이용할 수 있습니다.' },
      { title: '회원가입이나 앱 설치 없이 약속을 만들고 참여할 수 있나요?', body: '네. 주최자와 참여자 모두 회원가입이나 소셜 로그인 없이 이름만 입력하면 됩니다. 휴대폰이나 PC의 웹브라우저에서 약속을 만들고 투표할 수 있습니다.' },
      { title: '날짜만 정하거나 시간까지 투표할 수 있나요?', body: '네. 날짜 투표로 만날 날만 고르거나, 시간 투표로 가능한 시간대까지 모을 수 있습니다. 약속을 만들 때 일정에 맞는 방식을 선택하세요.' },
      { title: '단체 채팅방에서 일정 투표를 공유하려면 어떻게 하나요?', body: '약속 링크를 복사해 단체 채팅방, 메신저, 이메일로 보내세요. 참여자는 링크를 열고 이름과 가능한 일정을 입력하면 됩니다. 초대 코드로 약속을 찾을 수도 있습니다.' },
      { title: '모임 장소도 함께 투표할 수 있나요?', body: '네. 약속을 만들 때 장소 투표를 켜고 후보를 추가하세요. 참여자는 선호하는 장소에 투표하고, 댓글로 모임에 필요한 의견을 나눌 수 있습니다.' },
      { title: '투표한 일정을 수정하거나 다른 기기에서 이어서 참여할 수 있나요?', body: '일정 확정 전에는 처음 참여한 브라우저에서 약속 링크를 다시 열어 응답을 수정할 수 있습니다. 기기나 브라우저를 바꾸거나 브라우저 데이터를 지우면 기존 참여자로 인식되지 않을 수 있습니다. 같은 이름을 입력해도 이전 응답이나 주최자 권한이 복원되지는 않습니다.' },
      { title: '해외에 있는 사람과 시간대가 달라도 일정을 맞출 수 있나요?', body: '시간 투표는 주최자가 정한 모임 시간대를 기준으로 진행합니다. 결과는 다른 시간대로 바꿔 볼 수 있어 해외 팀이나 친구와 일정을 비교할 때 유용합니다. 날짜만 투표하는 경우에는 시간대에 따라 날짜가 바뀌지 않습니다.' },
      { title: '정한 약속을 캘린더에 추가할 수 있나요?', body: '네. 결과 화면에서 선택한 시간이나 확정된 약속을 ICS 파일로 내려받아, ICS를 지원하는 캘린더 앱에 가져올 수 있습니다. 캘린더를 연결하지 않아도 일정 투표는 이용할 수 있습니다.' },
    ],
    about: {
      title: 'Time2Gather 소개',
      intro: 'Time2Gather는 투표로 함께 만날 시간을 찾는 무료 일정 조율 서비스입니다.',
      sections: [
        { title: '우리의 목적', body: '누구나 링크 하나로 참여하고, 날짜·시간·장소에 대한 의견을 투명하게 모을 수 있게 합니다.' },
        { title: '이럴 때 사용하세요', body: '친구 모임, 스터디, 팀 회의까지. 링크로 가능한 시간을 모으고, 투표 결과를 보고 일정을 정하세요.' },
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
      noLogin: 'Start right away. No login required.',
      eyebrow: 'Getting together? Time2Gather',
      title: 'A time that works for all of us',
      description: 'Collect everyone’s availability and find a time to meet.',
      primary: 'Create a meeting',
      secondary: 'Find with a code',
    },
    stepsTitle: 'Settle plans in three steps',
    steps: [
      { title: '1. Create options', body: 'Enter a meeting name and the dates or times to compare.' },
      { title: '2. Share the link', body: 'Send it to friends, teammates, or your group.' },
      { title: '3. Confirm the plan', body: 'Review the votes and confirm the best schedule for everyone.' },
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      { title: 'How can a group find a time for a meetup or team meeting?', body: 'Create date and time options in Time2Gather and share the link. Everyone selects when they are available, then you compare the results and confirm a plan. It is free for friend groups, study groups, and team meetings.' },
      { title: 'Can I create and join a poll without signing up or installing an app?', body: 'Yes. Hosts and participants only need to enter a name, with no registration or social sign-in. Create meetings and vote in a web browser on your phone or computer.' },
      { title: 'Can we vote on dates only or on specific times?', body: 'Yes. Use a date poll to choose a day, or a time poll to collect available time slots. Choose the option that fits your plans when creating the meeting.' },
      { title: 'How do I share a scheduling poll in a group chat?', body: 'Copy the meeting link into a group chat, messenger, or email. Participants open it, enter a name, and select their availability. They can also find the meeting with its invitation code.' },
      { title: 'Can we vote on where to meet too?', body: 'Yes. Enable location voting when creating the meeting and add options. Participants can vote for preferred locations and discuss plans in the comments.' },
      { title: 'Can I change my response or continue on another device?', body: 'Before the plan is confirmed, reopen the link in the browser you first used to edit your response. Switching devices or browsers, or clearing browser data, may prevent recognition as the same participant. Entering the same name does not restore previous responses or host permissions.' },
      { title: 'Can people in different time zones coordinate a meeting?', body: 'Time polls use the meeting time zone chosen by the host. You can view results in another time zone to compare schedules with friends or teams abroad. Date-only polls keep the selected dates unchanged across time zones.' },
      { title: 'Can I add the plan to my calendar?', body: 'Yes. Download a selected time or the confirmed meeting from the results as an ICS file, then import it into a calendar app that supports ICS. You can use scheduling polls without connecting a calendar.' },
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
      noLogin: 'Empieza ahora, sin iniciar sesión.',
      eyebrow: 'Para reunirse, Time2Gather', title: 'Un horario que nos viene bien a todos', description: 'Reúne la disponibilidad del grupo y encuentra un momento para verse.', primary: 'Crear una reunión', secondary: 'Buscar con código',
    },
    stepsTitle: 'Decide en tres pasos',
    steps: [{ title: '1. Crea opciones', body: 'Añade el nombre, las fechas y las horas.' }, { title: '2. Comparte el enlace', body: 'Envíalo a amigos, compañeros o al grupo.' }, { title: '3. Confirma el plan', body: 'Revisa los votos y fija el mejor horario.' }],
    faqTitle: 'Preguntas frecuentes',
    faqs: [
      { title: '¿Cómo encontrar una fecha para una reunión de amigos o de equipo?', body: 'Crea opciones de fecha y hora en Time2Gather y comparte el enlace. Cada persona indica su disponibilidad; después compara los resultados y confirma el plan. Es gratis para amigos, grupos de estudio y equipos.' },
      { title: '¿Puedo crear una encuesta y participar sin registrarme ni instalar una app?', body: 'Sí. Organizadores y participantes solo tienen que indicar un nombre, sin registro ni inicio de sesión social. Puedes crear reuniones y votar desde el navegador del móvil o del ordenador.' },
      { title: '¿Podemos votar solo por fechas o también por horas?', body: 'Sí. Usa una encuesta de fechas para elegir el día o una de horas para recoger las franjas disponibles. Elige la opción al crear la reunión.' },
      { title: '¿Cómo comparto una encuesta de horarios en un chat de grupo?', body: 'Copia el enlace de la reunión en un chat, un mensaje o un correo. Cada participante lo abre, indica su nombre y selecciona su disponibilidad. También puede buscar la reunión con el código de invitación.' },
      { title: '¿Podemos votar también por el lugar?', body: 'Sí. Activa la votación de lugares al crear la reunión y añade opciones. Los participantes pueden votar por sus lugares preferidos y comentar los detalles del plan.' },
      { title: '¿Puedo cambiar mi respuesta o continuar desde otro dispositivo?', body: 'Antes de confirmar el plan, abre el enlace en el navegador que usaste al participar para editar tu respuesta. Cambiar de dispositivo o navegador, o borrar sus datos, puede impedir que se te reconozca. Usar el mismo nombre no recupera respuestas ni permisos de organizador.' },
      { title: '¿Pueden coordinarse personas en distintas zonas horarias?', body: 'Las encuestas de horas usan la zona horaria elegida por el organizador. Puedes ver los resultados en otra zona para comparar horarios con personas de otros países. En las encuestas solo de fechas, los días elegidos no cambian.' },
      { title: '¿Puedo añadir el plan a mi calendario?', body: 'Sí. Descarga desde los resultados una hora seleccionada o la reunión confirmada en un archivo ICS e impórtalo en una app de calendario compatible. No necesitas conectar un calendario para votar.' },
    ],
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
      noLogin: 'Comece agora, sem fazer login.',
      eyebrow: 'Para reunir o grupo, Time2Gather', title: 'Um horário que funciona para todos nós', description: 'Reúna a disponibilidade de todos e encontre um horário para se encontrar.', primary: 'Criar encontro', secondary: 'Buscar por código',
    },
    stepsTitle: 'Resolva em três passos',
    steps: [{ title: '1. Crie opções', body: 'Informe o nome, as datas e os horários.' }, { title: '2. Compartilhe o link', body: 'Envie para amigos, colegas ou seu grupo.' }, { title: '3. Confirme o plano', body: 'Confira os votos e escolha o melhor horário.' }],
    faqTitle: 'Perguntas frequentes',
    faqs: [
      { title: 'Como encontrar um horário para reunir amigos ou uma equipe?', body: 'Crie opções de datas e horários no Time2Gather e compartilhe o link. Cada pessoa indica sua disponibilidade; depois, compare os resultados e confirme o encontro. O serviço é gratuito para amigos, grupos de estudo e equipes.' },
      { title: 'Posso criar uma enquete e participar sem cadastro ou aplicativo?', body: 'Sim. Organizadores e participantes só precisam informar um nome, sem cadastro ou login social. Crie encontros e vote no navegador do celular ou computador.' },
      { title: 'Podemos votar só nas datas ou também nos horários?', body: 'Sim. Use uma enquete de datas para escolher o dia ou uma de horários para reunir os períodos disponíveis. Escolha o formato ao criar o encontro.' },
      { title: 'Como compartilho uma enquete de horários em um grupo de conversa?', body: 'Copie o link do encontro em uma conversa, mensagem ou e-mail. Os participantes abrem o link, informam um nome e selecionam sua disponibilidade. Também é possível encontrar o encontro pelo código de convite.' },
      { title: 'Podemos votar no local do encontro também?', body: 'Sim. Ative a votação de locais ao criar o encontro e adicione opções. Os participantes podem votar nos locais preferidos e conversar nos comentários.' },
      { title: 'Posso alterar minha resposta ou continuar em outro dispositivo?', body: 'Antes da confirmação, reabra o link no navegador usado na primeira participação para editar sua resposta. Trocar de dispositivo ou navegador, ou apagar seus dados, pode impedir seu reconhecimento. Usar o mesmo nome não recupera respostas nem permissões de organizador.' },
      { title: 'Pessoas em fusos horários diferentes podem combinar um encontro?', body: 'As enquetes de horários usam o fuso escolhido pelo organizador. Você pode ver os resultados em outro fuso para comparar horários com pessoas de outros países. Nas enquetes só de datas, os dias escolhidos não mudam.' },
      { title: 'Posso adicionar o encontro ao meu calendário?', body: 'Sim. Baixe um horário selecionado ou o encontro confirmado como arquivo ICS nos resultados e importe-o em um aplicativo de calendário compatível. Não é necessário conectar um calendário para votar.' },
    ],
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
      noLogin: 'Commencez tout de suite, sans connexion.',
      eyebrow: 'Pour se retrouver, Time2Gather', title: 'Un créneau qui nous convient à tous', description: 'Rassemblez les disponibilités de chacun et trouvez un moment pour vous retrouver.', primary: 'Créer une réunion', secondary: 'Rechercher par code',
    },
    stepsTitle: 'Décidez en trois étapes',
    steps: [{ title: '1. Créez les options', body: 'Ajoutez le nom, les dates et les horaires.' }, { title: '2. Partagez le lien', body: 'Envoyez-le à vos amis, collègues ou groupe.' }, { title: '3. Confirmez', body: 'Consultez les votes et fixez le meilleur créneau.' }],
    faqTitle: 'Questions fréquentes',
    faqs: [
      { title: 'Comment trouver un créneau pour une sortie ou une réunion d’équipe ?', body: 'Créez des propositions de dates et d’heures dans Time2Gather, puis partagez le lien. Chacun indique ses disponibilités. Comparez les résultats et confirmez un créneau. Le service est gratuit pour les amis, les groupes d’étude et les équipes.' },
      { title: 'Peut-on créer un sondage et participer sans inscription ni application ?', body: 'Oui. Organisateurs et participants saisissent simplement un nom, sans inscription ni connexion sociale. Créez des rencontres et votez dans le navigateur de votre téléphone ou ordinateur.' },
      { title: 'Peut-on voter uniquement pour des dates ou aussi pour des horaires ?', body: 'Oui. Un sondage de dates permet de choisir le jour ; un sondage d’horaires recueille les créneaux disponibles. Choisissez le mode adapté lors de la création.' },
      { title: 'Comment partager un sondage dans une conversation de groupe ?', body: 'Copiez le lien dans une conversation, une messagerie ou un e-mail. Les participants l’ouvrent, saisissent un nom et indiquent leurs disponibilités. Ils peuvent aussi retrouver la rencontre avec son code d’invitation.' },
      { title: 'Peut-on aussi voter pour le lieu ?', body: 'Oui. Activez le vote sur les lieux à la création et ajoutez des propositions. Les participants peuvent voter pour leurs lieux préférés et échanger dans les commentaires.' },
      { title: 'Peut-on modifier sa réponse ou utiliser un autre appareil ?', body: 'Avant la confirmation, rouvrez le lien dans le navigateur utilisé lors de votre première participation pour modifier votre réponse. Changer d’appareil ou de navigateur, ou effacer ses données, peut empêcher votre reconnaissance. Le même nom ne restaure ni les réponses ni les droits d’organisation.' },
      { title: 'Peut-on organiser une rencontre entre plusieurs fuseaux horaires ?', body: 'Les sondages d’horaires utilisent le fuseau choisi par l’organisateur. Les résultats peuvent être affichés dans un autre fuseau pour comparer les disponibilités à l’international. Les dates des sondages sans horaires restent inchangées.' },
      { title: 'Peut-on ajouter la rencontre à son calendrier ?', body: 'Oui. Téléchargez depuis les résultats un horaire sélectionné ou la rencontre confirmée au format ICS, puis importez le fichier dans une application compatible. Aucun calendrier connecté n’est nécessaire pour voter.' },
    ],
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
      noLogin: 'Direkt loslegen, ohne Anmeldung.',
      eyebrow: 'Zusammenkommen mit Time2Gather', title: 'Ein Termin, der uns allen passt', description: 'Sammelt eure Verfügbarkeiten und findet einen Termin für euer Treffen.', primary: 'Termin erstellen', secondary: 'Mit Code suchen',
    },
    stepsTitle: 'In drei Schritten zum Termin',
    steps: [{ title: '1. Optionen erstellen', body: 'Name, Tage und Uhrzeiten eingeben.' }, { title: '2. Link teilen', body: 'An Freunde, Kollegen oder die Gruppe senden.' }, { title: '3. Termin bestätigen', body: 'Stimmen prüfen und den besten Termin festlegen.' }],
    faqTitle: 'Häufige Fragen',
    faqs: [
      { title: 'Wie finden Gruppen einen Termin für ein Treffen oder eine Teamsitzung?', body: 'Erstellen Sie in Time2Gather Datums- und Zeitvorschläge und teilen Sie den Link. Alle wählen passende Termine aus. Vergleichen Sie die Ergebnisse und bestätigen Sie einen Termin. Für Freundeskreise, Lerngruppen und Teams ist die Nutzung kostenlos.' },
      { title: 'Kann ich ohne Registrierung oder App eine Abstimmung erstellen und teilnehmen?', body: 'Ja. Organisierende und Teilnehmende geben nur einen Namen ein. Registrierung und Anmeldung über soziale Netzwerke sind nicht nötig. Termine erstellen und abstimmen können Sie im Browser auf dem Smartphone oder Computer.' },
      { title: 'Können wir nur über Tage oder auch über Uhrzeiten abstimmen?', body: 'Ja. Eine Datumsabstimmung hilft, einen Tag zu wählen. Eine Zeitabstimmung sammelt verfügbare Zeitfenster. Wählen Sie beim Erstellen die passende Variante.' },
      { title: 'Wie teile ich eine Terminabstimmung im Gruppenchat?', body: 'Kopieren Sie den Terminlink in einen Gruppenchat, Messenger oder eine E-Mail. Teilnehmende öffnen ihn, geben einen Namen ein und wählen passende Termine. Auch der Einladungscode führt zum Termin.' },
      { title: 'Können wir auch über den Treffpunkt abstimmen?', body: 'Ja. Aktivieren Sie beim Erstellen die Ortsabstimmung und ergänzen Sie Vorschläge. Teilnehmende stimmen über bevorzugte Orte ab und können sich in den Kommentaren austauschen.' },
      { title: 'Kann ich meine Antwort ändern oder ein anderes Gerät nutzen?', body: 'Vor der Terminbestätigung können Sie den Link im ursprünglich verwendeten Browser öffnen und Ihre Antwort ändern. Ein Geräte- oder Browserwechsel oder das Löschen von Browserdaten kann die Wiedererkennung verhindern. Derselbe Name stellt frühere Antworten oder Organisationsrechte nicht wieder her.' },
      { title: 'Können Personen in verschiedenen Zeitzonen einen Termin finden?', body: 'Zeitabstimmungen verwenden die vom Organisator gewählte Zeitzone. Ergebnisse lassen sich in einer anderen Zeitzone anzeigen, um Termine mit Personen im Ausland zu vergleichen. Bei reinen Datumsabstimmungen bleiben die gewählten Tage unverändert.' },
      { title: 'Kann ich den Termin in meinen Kalender übernehmen?', body: 'Ja. Laden Sie eine ausgewählte Uhrzeit oder den bestätigten Termin als ICS-Datei herunter und importieren Sie diese in eine Kalender-App mit ICS-Unterstützung. Für Abstimmungen müssen Sie keinen Kalender verbinden.' },
    ],
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
      noLogin: 'ログインなしで、すぐに始められます。',
      eyebrow: 'みんなで会うなら、Time2Gather', title: 'みんなの都合が合う時間', description: 'それぞれの空いている時間を集めて、みんなで会える時間を見つけましょう。', primary: '予定を作成', secondary: 'コードで検索',
    },
    stepsTitle: '3ステップで決定',
    steps: [{ title: '1. 候補を作る', body: '予定名と日付・時間を入力します。' }, { title: '2. リンクを共有', body: '友人やチームに送ります。' }, { title: '3. 予定を確定', body: '結果を確認して最適な時間を決めます。' }],
    faqTitle: 'よくある質問',
    faqs: [
      { title: '友人との集まりやチーム会議の日程をどう調整できますか？', body: 'Time2Gatherで日時の候補を作り、リンクを共有します。各自が都合のよい日程を選んだら、結果を比較して予定を確定できます。友人の集まり、勉強会、チーム会議に無料で使えます。' },
      { title: '会員登録やアプリのインストールなしで作成・参加できますか？', body: 'はい。主催者も参加者も名前を入力するだけで、会員登録やSNSログインは不要です。スマートフォンやパソコンのブラウザーで予定の作成と投票ができます。' },
      { title: '日付だけでも、時間まで含めても投票できますか？', body: 'はい。日付投票では集まる日を、時間投票では空いている時間帯まで選べます。予定を作る際に目的に合う方式を選んでください。' },
      { title: 'グループチャットで日程投票を共有するには？', body: '予定のリンクをコピーして、グループチャットやメッセンジャー、メールで送ります。参加者はリンクを開き、名前と都合のよい日程を入力します。招待コードから予定を探すこともできます。' },
      { title: '集まる場所も投票できますか？', body: 'はい。予定を作る際に場所の投票を有効にして候補を追加します。参加者は希望の場所に投票し、コメントで相談できます。' },
      { title: '回答の変更や別の端末からの参加はできますか？', body: '予定が確定する前なら、最初に参加したブラウザーでリンクを開き直して回答を変更できます。端末やブラウザーの変更、ブラウザーデータの削除で同じ参加者と認識されなくなる場合があります。同じ名前を入力しても、以前の回答や主催者権限は復元されません。' },
      { title: '時差のある海外の人とも日程調整できますか？', body: '時間投票は主催者が選んだ予定のタイムゾーンを基準に行います。結果は別のタイムゾーンでも表示でき、海外の友人やチームとの比較に役立ちます。日付だけの投票ではタイムゾーンによって日付は変わりません。' },
      { title: '決まった予定をカレンダーに追加できますか？', body: 'はい。結果画面で選択した時間や確定済みの予定をICSファイルとしてダウンロードし、ICS対応のカレンダーアプリに読み込めます。カレンダーを接続しなくても日程投票は利用できます。' },
    ],
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
      noLogin: '无需登录，即刻开始。',
      eyebrow: '多人相聚，就用 Time2Gather', title: '我们都有空的时间', description: '汇总每个人的空闲时间，找到大家都能见面的时刻。', primary: '创建约会', secondary: '使用代码查找',
    },
    stepsTitle: '三步确定安排',
    steps: [{ title: '1. 创建选项', body: '填写活动名称、日期和时间。' }, { title: '2. 分享链接', body: '发送给朋友、同事或群组。' }, { title: '3. 确认安排', body: '查看投票并确定最佳时间。' }],
    faqTitle: '常见问题',
    faqs: [
      { title: '朋友聚会或团队会议，怎样协调多人日程？', body: '在Time2Gather创建日期和时间选项并分享链接。每个人选择有空的时段后，即可对比结果并确定安排。朋友聚会、学习小组和团队会议均可免费使用。' },
      { title: '不注册、不安装应用也能创建和参与投票吗？', body: '可以。组织者和参与者只需输入名字，无需注册或社交账号登录。使用手机或电脑浏览器即可创建活动和投票。' },
      { title: '可以只投日期，也可以投具体时间吗？', body: '可以。日期投票用于选择哪一天，时间投票用于收集有空的时间段。创建活动时选择适合的方式即可。' },
      { title: '怎样在群聊中分享日程投票？', body: '复制活动链接，通过群聊、即时消息或电子邮件发送。参与者打开链接，输入名字并选择有空的时间。也可使用邀请码查找活动。' },
      { title: '也能投票选择见面地点吗？', body: '可以。创建活动时开启地点投票并添加候选地点。参与者可以选择喜欢的地点，并在评论中讨论安排。' },
      { title: '可以修改回答或换设备继续参与吗？', body: '活动确定前，可在首次参与的浏览器中重新打开链接修改回答。更换设备、浏览器或清除浏览器数据后，可能无法被识别为原参与者。输入相同名字也不会恢复原回答或组织者权限。' },
      { title: '不同时区的人也能协调日程吗？', body: '时间投票以组织者选择的活动时区为准。结果可切换到其他时区查看，方便与海外朋友或团队对比时间。仅日期投票中的日期不会随时区变化。' },
      { title: '可以把安排加入日历吗？', body: '可以。在结果页面将选中的时间或已确定的活动下载为ICS文件，再导入支持ICS的日历应用。无需连接日历也能使用日程投票。' },
    ],
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
      noLogin: 'बिना लॉग इन किए तुरंत शुरू करें।',
      eyebrow: 'साथ मिलने के लिए, Time2Gather', title: 'ऐसा समय जब हम सब मिल सकें', description: 'सबके खाली समय को एक साथ देखें और मिलने का समय चुनें।', primary: 'मीटिंग बनाएँ', secondary: 'कोड से खोजें',
    },
    stepsTitle: 'तीन चरणों में योजना तय करें',
    steps: [{ title: '1. विकल्प बनाएँ', body: 'नाम, तारीखें और समय जोड़ें।' }, { title: '2. लिंक साझा करें', body: 'दोस्तों, टीम या समूह को भेजें।' }, { title: '3. योजना पक्की करें', body: 'वोट देखकर सबसे अच्छा समय तय करें।' }],
    faqTitle: 'अक्सर पूछे जाने वाले सवाल',
    faqs: [
      { title: 'दोस्तों की मुलाकात या टीम मीटिंग का साझा समय कैसे तय करें?', body: 'Time2Gather में तारीख और समय के विकल्प बनाकर लिंक साझा करें। हर व्यक्ति अपनी उपलब्धता चुनता है, फिर परिणामों की तुलना करके समय तय करें। दोस्तों, अध्ययन समूहों और टीमों के लिए यह मुफ़्त है।' },
      { title: 'क्या बिना पंजीकरण या ऐप इंस्टॉल किए पोल बना सकते हैं और भाग ले सकते हैं?', body: 'हाँ। आयोजक और प्रतिभागी केवल अपना नाम दर्ज करें; पंजीकरण या सोशल लॉगिन की ज़रूरत नहीं है। फ़ोन या कंप्यूटर के ब्राउज़र में मीटिंग बनाएँ और वोट दें।' },
      { title: 'क्या केवल तारीख या समय के लिए भी वोट कर सकते हैं?', body: 'हाँ। दिन चुनने के लिए तारीख वाला पोल और उपलब्ध समय जानने के लिए समय वाला पोल चुनें। मीटिंग बनाते समय उपयुक्त विकल्प चुनें।' },
      { title: 'ग्रुप चैट में समय तय करने वाला पोल कैसे साझा करें?', body: 'मीटिंग का लिंक ग्रुप चैट, मैसेज या ईमेल में भेजें। प्रतिभागी लिंक खोलकर नाम और उपलब्ध समय दर्ज करते हैं। निमंत्रण कोड से भी मीटिंग खोज सकते हैं।' },
      { title: 'क्या मिलने की जगह के लिए भी वोट कर सकते हैं?', body: 'हाँ। मीटिंग बनाते समय स्थान मतदान चालू करके विकल्प जोड़ें। प्रतिभागी पसंदीदा जगह चुन सकते हैं और टिप्पणियों में चर्चा कर सकते हैं।' },
      { title: 'क्या जवाब बदल सकते हैं या दूसरे डिवाइस से जारी रख सकते हैं?', body: 'मीटिंग तय होने से पहले उसी ब्राउज़र में लिंक दोबारा खोलकर जवाब बदलें जिससे पहली बार भाग लिया था। डिवाइस या ब्राउज़र बदलने या ब्राउज़र डेटा मिटाने पर पुरानी पहचान नहीं मिल सकती। वही नाम दर्ज करने से पुराने जवाब या आयोजक के अधिकार वापस नहीं मिलते।' },
      { title: 'क्या अलग-अलग समय क्षेत्रों के लोग समय तय कर सकते हैं?', body: 'समय वाले पोल आयोजक द्वारा चुने गए मीटिंग के समय क्षेत्र पर आधारित हैं। विदेश में दोस्तों या टीमों से तुलना करने के लिए परिणाम दूसरे समय क्षेत्र में देख सकते हैं। केवल तारीख वाले पोल में दिन नहीं बदलते।' },
      { title: 'क्या तय मीटिंग कैलेंडर में जोड़ सकते हैं?', body: 'हाँ। परिणामों से चुना हुआ समय या तय मीटिंग ICS फ़ाइल के रूप में डाउनलोड करें और ICS समर्थित कैलेंडर ऐप में आयात करें। पोल के लिए कैलेंडर जोड़ना ज़रूरी नहीं है।' },
    ],
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
      noLogin: 'ابدأ فورًا دون تسجيل الدخول.',
      eyebrow: 'للقاء يجمعكم، Time2Gather', title: 'وقت يناسبنا جميعًا', description: 'اجمعوا أوقات تفرّغ الجميع واعثروا على وقت تلتقون فيه.', primary: 'إنشاء موعد', secondary: 'البحث برمز',
    },
    stepsTitle: 'حدّد الخطة في ثلاث خطوات',
    steps: [{ title: '1. أنشئ الخيارات', body: 'أدخل اسم الموعد والتواريخ والأوقات.' }, { title: '2. شارك الرابط', body: 'أرسله إلى الأصدقاء أو الزملاء أو المجموعة.' }, { title: '3. أكّد الخطة', body: 'راجع الأصوات وحدد أفضل وقت.' }],
    faqTitle: 'الأسئلة الشائعة',
    faqs: [
      { title: 'كيف نجد موعدًا للقاء الأصدقاء أو لاجتماع الفريق؟', body: 'أنشئ خيارات للتاريخ والوقت في Time2Gather وشارك الرابط. يختار الجميع مواعيد تفرغهم، ثم تقارن النتائج وتؤكد الموعد. الخدمة مجانية للأصدقاء ومجموعات الدراسة والفرق.' },
      { title: 'هل يمكن إنشاء التصويت والمشاركة دون تسجيل أو تثبيت تطبيق؟', body: 'نعم. يكفي أن يُدخل المنظم والمشاركون أسماءهم، دون إنشاء حساب أو تسجيل دخول اجتماعي. يمكنك إنشاء اللقاءات والتصويت من متصفح الهاتف أو الحاسوب.' },
      { title: 'هل يمكن التصويت على الأيام فقط أو على الأوقات أيضًا؟', body: 'نعم. اختر تصويت التواريخ لتحديد اليوم، أو تصويت الأوقات لجمع الفترات المتاحة. حدد النوع المناسب عند إنشاء اللقاء.' },
      { title: 'كيف أشارك تصويت المواعيد في محادثة جماعية؟', body: 'انسخ رابط اللقاء وأرسله عبر محادثة جماعية أو تطبيق مراسلة أو بريد إلكتروني. يفتح المشاركون الرابط ويدخلون أسماءهم ويختارون المواعيد المناسبة. يمكن أيضًا العثور على اللقاء برمز الدعوة.' },
      { title: 'هل يمكن التصويت على مكان اللقاء أيضًا؟', body: 'نعم. فعّل التصويت على المكان عند إنشاء اللقاء وأضف الخيارات. يمكن للمشاركين اختيار الأماكن المفضلة ومناقشة الترتيبات في التعليقات.' },
      { title: 'هل يمكن تعديل إجابتي أو المتابعة من جهاز آخر؟', body: 'قبل تأكيد الموعد، افتح الرابط مجددًا في المتصفح الذي شاركت منه أول مرة لتعديل إجابتك. قد يمنع تغيير الجهاز أو المتصفح أو مسح بياناته التعرف عليك كمشارك سابق. إدخال الاسم نفسه لا يستعيد الإجابات السابقة أو صلاحيات المنظم.' },
      { title: 'هل يمكن تنسيق موعد بين أشخاص في مناطق زمنية مختلفة؟', body: 'تستخدم تصويتات الأوقات المنطقة الزمنية التي يختارها المنظم. يمكنك عرض النتائج بمنطقة أخرى لمقارنة المواعيد مع الأصدقاء أو الفرق في الخارج. أما تصويتات التواريخ فقط فلا تتغير تواريخها بتغيير المنطقة الزمنية.' },
      { title: 'هل يمكن إضافة الموعد إلى التقويم؟', body: 'نعم. نزّل الوقت المختار أو اللقاء المؤكد من النتائج بصيغة ICS، ثم استورده في تطبيق تقويم يدعمها. يمكنك استخدام التصويت دون ربط تقويم.' },
    ],
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
      noLogin: 'Langsung mulai tanpa login.',
      eyebrow: 'Untuk bertemu bersama, Time2Gather', title: 'Waktu yang cocok untuk kita semua', description: 'Kumpulkan waktu luang setiap orang dan temukan waktu untuk bertemu.', primary: 'Buat pertemuan', secondary: 'Cari dengan kode',
    },
    stepsTitle: 'Selesaikan dalam tiga langkah',
    steps: [{ title: '1. Buat pilihan', body: 'Masukkan nama, tanggal, dan waktu.' }, { title: '2. Bagikan tautan', body: 'Kirim ke teman, rekan, atau kelompok.' }, { title: '3. Tetapkan rencana', body: 'Tinjau suara dan pilih waktu terbaik.' }],
    faqTitle: 'Pertanyaan umum',
    faqs: [
      { title: 'Bagaimana mencari waktu untuk berkumpul dengan teman atau rapat tim?', body: 'Buat pilihan tanggal dan waktu di Time2Gather, lalu bagikan tautannya. Setiap orang memilih waktu luang, kemudian Anda membandingkan hasil dan menetapkan jadwal. Gratis untuk teman, kelompok belajar, dan tim.' },
      { title: 'Bisakah membuat dan mengikuti polling tanpa mendaftar atau memasang aplikasi?', body: 'Ya. Penyelenggara dan peserta cukup memasukkan nama, tanpa pendaftaran atau login media sosial. Buat pertemuan dan pilih jadwal melalui browser ponsel atau komputer.' },
      { title: 'Bisakah memilih tanggal saja atau juga jam tertentu?', body: 'Ya. Polling tanggal digunakan untuk memilih hari, sedangkan polling waktu mengumpulkan slot yang tersedia. Pilih jenisnya saat membuat pertemuan.' },
      { title: 'Bagaimana membagikan polling jadwal di grup chat?', body: 'Salin tautan pertemuan ke grup chat, aplikasi pesan, atau email. Peserta membuka tautan, memasukkan nama, lalu memilih waktu yang cocok. Pertemuan juga dapat ditemukan dengan kode undangan.' },
      { title: 'Bisakah kami memilih tempat pertemuan juga?', body: 'Ya. Aktifkan pemungutan suara lokasi saat membuat pertemuan dan tambahkan pilihan. Peserta dapat memilih lokasi favorit dan membahas rencana di komentar.' },
      { title: 'Bisakah mengubah jawaban atau melanjutkan di perangkat lain?', body: 'Sebelum jadwal ditetapkan, buka kembali tautan di browser yang pertama kali dipakai untuk mengubah jawaban. Mengganti perangkat atau browser, atau menghapus datanya, dapat membuat Anda tidak dikenali sebagai peserta semula. Nama yang sama tidak memulihkan jawaban atau hak penyelenggara.' },
      { title: 'Bisakah orang di zona waktu berbeda mengatur pertemuan?', body: 'Polling waktu memakai zona waktu pertemuan yang dipilih penyelenggara. Hasil dapat dilihat dalam zona lain untuk membandingkan jadwal dengan teman atau tim di luar negeri. Tanggal pada polling khusus tanggal tidak berubah antar zona waktu.' },
      { title: 'Bisakah jadwal ditambahkan ke kalender?', body: 'Ya. Unduh waktu yang dipilih atau pertemuan yang telah ditetapkan dari hasil sebagai file ICS, lalu impor ke aplikasi kalender yang mendukung ICS. Kalender tidak perlu dihubungkan untuk mengikuti polling.' },
    ],
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
      noLogin: 'Giriş yapmadan hemen başlayın.',
      eyebrow: 'Bir araya gelmek için Time2Gather', title: 'Hepimize uyan bir zaman', description: 'Herkesin uygun olduğu saatleri toplayın ve buluşabileceğiniz bir zaman bulun.', primary: 'Toplantı oluştur', secondary: 'Kodla bul',
    },
    stepsTitle: 'Üç adımda planlayın',
    steps: [{ title: '1. Seçenek oluşturun', body: 'Adı, tarihleri ve saatleri girin.' }, { title: '2. Bağlantıyı paylaşın', body: 'Arkadaşlarınıza, ekibinize veya grubunuza gönderin.' }, { title: '3. Planı kesinleştirin', body: 'Oyları inceleyip en iyi zamanı seçin.' }],
    faqTitle: 'Sık sorulan sorular',
    faqs: [
      { title: 'Arkadaş buluşması veya ekip toplantısı için ortak zaman nasıl bulunur?', body: 'Time2Gather’da tarih ve saat seçenekleri oluşturup bağlantıyı paylaşın. Herkes uygun zamanlarını seçer; sonuçları karşılaştırıp planı kesinleştirebilirsiniz. Arkadaşlar, çalışma grupları ve ekipler için ücretsizdir.' },
      { title: 'Kayıt olmadan veya uygulama yüklemeden anket oluşturup katılabilir miyim?', body: 'Evet. Düzenleyenler ve katılımcılar yalnızca adlarını girer; kayıt veya sosyal hesapla giriş gerekmez. Telefon ya da bilgisayar tarayıcısından toplantı oluşturup oy verebilirsiniz.' },
      { title: 'Yalnızca tarihler veya belirli saatler için oy verebilir miyiz?', body: 'Evet. Günü seçmek için tarih anketini, uygun saat aralıklarını toplamak için saat anketini kullanın. Toplantıyı oluştururken uygun türü seçin.' },
      { title: 'Bir planlama anketini grup sohbetinde nasıl paylaşırım?', body: 'Toplantı bağlantısını grup sohbetine, mesaja veya e-postaya kopyalayın. Katılımcılar bağlantıyı açar, adlarını girer ve uygun zamanlarını seçer. Davet koduyla da toplantı bulunabilir.' },
      { title: 'Buluşma yeri için de oy verebilir miyiz?', body: 'Evet. Toplantıyı oluştururken yer oylamasını açıp seçenek ekleyin. Katılımcılar tercih ettikleri yerlere oy verebilir ve yorumlarda planı konuşabilir.' },
      { title: 'Yanıtımı değiştirebilir veya başka bir cihazdan devam edebilir miyim?', body: 'Plan kesinleşmeden önce ilk kullandığınız tarayıcıda bağlantıyı yeniden açıp yanıtınızı düzenleyebilirsiniz. Cihaz veya tarayıcı değiştirmek ya da tarayıcı verilerini silmek tanınmanızı engelleyebilir. Aynı adı girmek önceki yanıtları veya düzenleyici yetkilerini geri getirmez.' },
      { title: 'Farklı saat dilimlerindeki kişiler toplantı planlayabilir mi?', body: 'Saat anketleri düzenleyenin seçtiği toplantı saat dilimini kullanır. Yurt dışındaki kişilerle karşılaştırmak için sonuçları başka bir saat diliminde görebilirsiniz. Yalnızca tarih anketlerinde seçilen günler değişmez.' },
      { title: 'Planı takvimime ekleyebilir miyim?', body: 'Evet. Sonuçlardan seçilen saati veya kesinleşmiş toplantıyı ICS dosyası olarak indirip ICS destekleyen bir takvim uygulamasına aktarın. Anket için takvim bağlamak gerekmez.' },
    ],
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
      noLogin: 'Bắt đầu ngay, không cần đăng nhập.',
      eyebrow: 'Hẹn gặp nhau cùng Time2Gather', title: 'Thời gian phù hợp với tất cả chúng ta', description: 'Tổng hợp thời gian rảnh của từng người và tìm lúc mọi người có thể gặp nhau.', primary: 'Tạo cuộc hẹn', secondary: 'Tìm bằng mã',
    },
    stepsTitle: 'Ba bước để chốt lịch',
    steps: [{ title: '1. Tạo lựa chọn', body: 'Nhập tên, ngày và giờ.' }, { title: '2. Chia sẻ liên kết', body: 'Gửi cho bạn bè, đồng nghiệp hoặc nhóm.' }, { title: '3. Xác nhận kế hoạch', body: 'Xem kết quả và chọn thời gian tốt nhất.' }],
    faqTitle: 'Câu hỏi thường gặp',
    faqs: [
      { title: 'Làm sao tìm lịch chung cho buổi gặp bạn bè hoặc họp nhóm?', body: 'Tạo các lựa chọn ngày và giờ trên Time2Gather rồi chia sẻ liên kết. Mỗi người chọn lúc rảnh, sau đó bạn so sánh kết quả và chốt lịch. Dịch vụ miễn phí cho bạn bè, nhóm học tập và nhóm làm việc.' },
      { title: 'Có thể tạo và tham gia bình chọn mà không đăng ký hay cài ứng dụng không?', body: 'Có. Người tổ chức và người tham gia chỉ cần nhập tên, không cần đăng ký hoặc đăng nhập qua mạng xã hội. Bạn có thể tạo cuộc hẹn và bình chọn bằng trình duyệt trên điện thoại hoặc máy tính.' },
      { title: 'Có thể bình chọn chỉ ngày hoặc cả giờ cụ thể không?', body: 'Có. Bình chọn ngày giúp chọn ngày gặp, còn bình chọn giờ giúp thu thập các khung giờ rảnh. Hãy chọn loại phù hợp khi tạo cuộc hẹn.' },
      { title: 'Làm sao chia sẻ bình chọn lịch trong nhóm chat?', body: 'Sao chép liên kết cuộc hẹn vào nhóm chat, tin nhắn hoặc email. Người tham gia mở liên kết, nhập tên và chọn lịch phù hợp. Cũng có thể tìm cuộc hẹn bằng mã mời.' },
      { title: 'Có thể bình chọn cả địa điểm gặp không?', body: 'Có. Bật bình chọn địa điểm khi tạo cuộc hẹn và thêm các lựa chọn. Người tham gia có thể chọn địa điểm yêu thích và trao đổi trong phần bình luận.' },
      { title: 'Có thể sửa câu trả lời hoặc tiếp tục trên thiết bị khác không?', body: 'Trước khi chốt lịch, mở lại liên kết trong trình duyệt đã dùng lần đầu để sửa câu trả lời. Đổi thiết bị, trình duyệt hoặc xóa dữ liệu trình duyệt có thể khiến bạn không được nhận diện là người tham gia cũ. Nhập cùng tên không khôi phục câu trả lời hay quyền tổ chức.' },
      { title: 'Người ở các múi giờ khác nhau có thể tìm lịch chung không?', body: 'Bình chọn giờ dùng múi giờ cuộc hẹn do người tổ chức chọn. Bạn có thể xem kết quả theo múi giờ khác để so sánh lịch với người ở nước ngoài. Ngày trong bình chọn chỉ ngày không thay đổi theo múi giờ.' },
      { title: 'Có thể thêm cuộc hẹn vào lịch không?', body: 'Có. Tải giờ đã chọn hoặc cuộc hẹn đã chốt từ kết quả dưới dạng tệp ICS, rồi nhập vào ứng dụng lịch hỗ trợ ICS. Không cần kết nối lịch để bình chọn.' },
    ],
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
      noLogin: 'เริ่มได้ทันทีโดยไม่ต้องเข้าสู่ระบบ',
      eyebrow: 'นัดเจอกันเมื่อไหร่ ใช้ Time2Gather', title: 'เวลาที่พวกเราว่างตรงกัน', description: 'รวบรวมเวลาว่างของแต่ละคน แล้วหาเวลาที่ทุกคนมาเจอกันได้', primary: 'สร้างนัดหมาย', secondary: 'ค้นหาด้วยรหัส',
    },
    stepsTitle: 'สรุปแผนในสามขั้นตอน',
    steps: [{ title: '1. สร้างตัวเลือก', body: 'ใส่ชื่อ วันที่ และเวลา' }, { title: '2. แชร์ลิงก์', body: 'ส่งให้เพื่อน ทีม หรือกลุ่ม' }, { title: '3. ยืนยันแผน', body: 'ดูผลโหวตและเลือกเวลาที่ดีที่สุด' }],
    faqTitle: 'คำถามที่พบบ่อย',
    faqs: [
      { title: 'จะหาเวลานัดเพื่อนหรือประชุมทีมที่ตรงกันได้อย่างไร?', body: 'สร้างตัวเลือกวันและเวลาใน Time2Gather แล้วแชร์ลิงก์ ทุกคนเลือกเวลาที่สะดวก จากนั้นเปรียบเทียบผลและยืนยันนัดหมายได้ ใช้ฟรีสำหรับกลุ่มเพื่อน กลุ่มเรียน และทีมงาน' },
      { title: 'สร้างและร่วมโหวตได้โดยไม่สมัครสมาชิกหรือติดตั้งแอปไหม?', body: 'ได้ ผู้จัดและผู้เข้าร่วมเพียงกรอกชื่อ ไม่ต้องสมัครสมาชิกหรือเข้าสู่ระบบด้วยบัญชีโซเชียล สร้างนัดหมายและโหวตผ่านเบราว์เซอร์บนมือถือหรือคอมพิวเตอร์ได้' },
      { title: 'โหวตเฉพาะวันหรือรวมช่วงเวลาได้ไหม?', body: 'ได้ ใช้โหวตวันที่เพื่อเลือกวันนัด หรือโหวตเวลาเพื่อรวบรวมช่วงเวลาที่ว่าง เลือกรูปแบบที่เหมาะสมตอนสร้างนัดหมาย' },
      { title: 'จะแชร์โหวตนัดหมายในแชตกลุ่มอย่างไร?', body: 'คัดลอกลิงก์นัดหมายไปยังแชตกลุ่ม แอปข้อความ หรืออีเมล ผู้เข้าร่วมเปิดลิงก์ กรอกชื่อ และเลือกเวลาที่สะดวก หรือค้นหานัดหมายด้วยรหัสเชิญก็ได้' },
      { title: 'โหวตสถานที่นัดพบด้วยได้ไหม?', body: 'ได้ เปิดโหวตสถานที่ตอนสร้างนัดหมายแล้วเพิ่มตัวเลือก ผู้เข้าร่วมโหวตสถานที่ที่ชอบและพูดคุยเรื่องนัดหมายในความคิดเห็นได้' },
      { title: 'แก้ไขคำตอบหรือใช้เครื่องอื่นต่อได้ไหม?', body: 'ก่อนยืนยันนัดหมาย ให้เปิดลิงก์อีกครั้งในเบราว์เซอร์ที่ใช้เข้าร่วมครั้งแรกเพื่อแก้คำตอบ การเปลี่ยนอุปกรณ์หรือเบราว์เซอร์ หรือลบข้อมูลเบราว์เซอร์ อาจทำให้ระบบจำผู้เข้าร่วมเดิมไม่ได้ การกรอกชื่อเดิมไม่คืนคำตอบหรือสิทธิ์ผู้จัด' },
      { title: 'คนที่อยู่ต่างเขตเวลาหาเวลานัดร่วมกันได้ไหม?', body: 'โหวตเวลาใช้เขตเวลานัดหมายที่ผู้จัดเลือก คุณดูผลในเขตเวลาอื่นเพื่อเทียบเวลากับเพื่อนหรือทีมต่างประเทศได้ โหวตเฉพาะวันที่จะไม่เปลี่ยนวันตามเขตเวลา' },
      { title: 'เพิ่มนัดหมายลงปฏิทินได้ไหม?', body: 'ได้ ดาวน์โหลดเวลาที่เลือกหรือนัดหมายที่ยืนยันแล้วจากหน้าผลเป็นไฟล์ ICS แล้วนำเข้าแอปปฏิทินที่รองรับ ICS ใช้โหวตได้โดยไม่ต้องเชื่อมต่อปฏิทิน' },
    ],
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
      noLogin: 'Начните прямо сейчас без входа в аккаунт.',
      eyebrow: 'Для встреч вместе — Time2Gather', title: 'Время, которое подходит всем нам', description: 'Соберите информацию о том, когда каждый свободен, и найдите время для встречи.', primary: 'Создать встречу', secondary: 'Найти по коду',
    },
    stepsTitle: 'Три шага до готового плана',
    steps: [{ title: '1. Создайте варианты', body: 'Укажите название, даты и время.' }, { title: '2. Поделитесь ссылкой', body: 'Отправьте друзьям, коллегам или группе.' }, { title: '3. Подтвердите план', body: 'Посмотрите результаты и выберите лучшее время.' }],
    faqTitle: 'Частые вопросы',
    faqs: [
      { title: 'Как согласовать время встречи с друзьями или командой?', body: 'Создайте варианты дат и времени в Time2Gather и поделитесь ссылкой. Каждый отмечает свободное время, затем вы сравниваете результаты и подтверждаете встречу. Сервис бесплатен для друзей, учебных групп и команд.' },
      { title: 'Можно создать опрос и участвовать без регистрации и установки приложения?', body: 'Да. Организатору и участникам достаточно указать имя, без регистрации и входа через соцсети. Создавайте встречи и голосуйте в браузере телефона или компьютера.' },
      { title: 'Можно голосовать только за даты или и за время?', body: 'Да. Опрос по датам помогает выбрать день, а опрос по времени — собрать доступные интервалы. Выберите подходящий вариант при создании встречи.' },
      { title: 'Как поделиться опросом в групповом чате?', body: 'Скопируйте ссылку на встречу в чат, мессенджер или письмо. Участники открывают её, указывают имя и отмечают удобное время. Встречу также можно найти по коду приглашения.' },
      { title: 'Можно голосовать и за место встречи?', body: 'Да. Включите голосование за место при создании встречи и добавьте варианты. Участники выбирают предпочтительные места и обсуждают планы в комментариях.' },
      { title: 'Можно изменить ответ или продолжить с другого устройства?', body: 'До подтверждения встречи откройте ссылку в браузере, которым пользовались при первом участии, и измените ответ. Смена устройства или браузера либо удаление его данных может помешать распознать вас. То же имя не восстанавливает ответы или права организатора.' },
      { title: 'Можно согласовать встречу между разными часовыми поясами?', body: 'Опросы по времени используют часовой пояс, выбранный организатором. Результаты можно просматривать в другом поясе, чтобы сравнить расписания с людьми за рубежом. В опросах только по датам выбранные дни не меняются.' },
      { title: 'Можно добавить встречу в календарь?', body: 'Да. Скачайте выбранное время или подтверждённую встречу из результатов как файл ICS и импортируйте его в совместимое приложение календаря. Для голосования подключать календарь не нужно.' },
    ],
    about: { title: 'О Time2Gather', intro: 'Time2Gather — бесплатный инструмент, который сокращает переписку при планировании групповых встреч.', sections: [{ title: 'Наша цель', body: 'Дать каждому возможность присоединиться по одной ссылке и понятно указать доступность.' }, { title: 'Как это работает', body: 'Организатор создаёт варианты, делится ссылкой, смотрит голоса и подтверждает план.' }, { title: 'Наши принципы', body: 'Простое участие, понятный результат, минимум данных и единый опыт.' }] },
    contact: {
      title: 'Связаться с нами', intro: 'Напишите нам о сервисе, ошибке, конфиденциальности или предложении.', emailTitle: 'Электронная почта', emailBody: 'При сообщении об ошибке укажите браузер и страницу, где она возникла.', responseTitle: 'Ответы', responseBody: 'Мы рассматриваем сообщения как можно быстрее. Для запросов о данных может потребоваться подтверждение личности.',
    },
    privacy: { title: 'Политика конфиденциальности', intro: 'Time2Gather обрабатывает только необходимые данные и не продаёт персональную информацию.', sections: [{ title: 'Какие данные обрабатываются', body: 'Возможны данные аккаунта, встреч, вариантов, голосов, имён, сессий и подключения.' }, { title: 'Как мы используем данные', body: 'Для работы сервиса, управления аккаунтами, безопасности и улучшений.' }, { title: 'Аналитика и поставщики', body: 'Google Analytics и технические поставщики могут обрабатывать необходимые данные.' }, { title: 'Хранение и ваши права', body: 'Данные хранятся по необходимости. Можно запросить доступ, исправление или удаление.' }, { title: 'Международная обработка', body: 'Поставщики могут обрабатывать данные за пределами вашей страны с разумными мерами защиты.' }] },
    terms: { title: 'Условия использования', intro: 'Используя Time2Gather, вы соглашаетесь с этими условиями.', sections: [{ title: 'Использование сервиса', body: 'Соблюдайте закон и уважайте права других.' }, { title: 'Ваша ответственность', body: 'Вы отвечаете за контент, ссылки, аккаунт и отправленные данные.' }, { title: 'Изменения и доступность', body: 'Функции могут изменяться или приостанавливаться ради качества и безопасности.' }, { title: 'Права и ограничения', body: 'Запрещено копировать, нарушать работу или злоупотреблять сервисом.' }, { title: 'Ограничение ответственности', body: 'Сервис предоставляется по мере доступности, ответственность ограничена законом.' }] },
    updated: 'Последнее обновление: 14 октября 2026 г.', footer: 'Найдите время, удобное всем.',
  },
}

const generated = import.meta.glob('./locales/*.json', { eager: true, import: 'default' }) as Record<string, MarketingCopy>
export const marketingCopy = { ...existingMarketingCopy, ...Object.fromEntries(Object.entries(generated).map(([path, copy]) => [path.split('/').pop()!.replace('.json', ''), copy])) } as Record<MarketingLocale, MarketingCopy>
