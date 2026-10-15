export interface GuideSection {
  title: string;
  content: string;
}

export interface LanguageGuide {
  id: string;
  name: string;
  nativeName: string;
  bcp47: string;
  dir: 'ltr' | 'rtl';
  title: string;
  summary: string;
  sections: GuideSection[];
  ttsSpeechText: string;
}

export const LANGUAGE_GUIDES: Record<string, LanguageGuide> = {
  en: {
    id: 'en',
    name: 'English',
    nativeName: 'English',
    bcp47: 'en-US',
    dir: 'ltr',
    title: 'KBT_Recorder — Comprehensive Production User Guide',
    summary: 'Professional multi-cloud voice recorder with real-time DSP, VU metering, zero-knowledge encryption, audio editing, and a 21-language capstone architecture hub.',
    ttsSpeechText: 'Welcome to KBT Recorder, an enterprise voice recording suite inspired by RecForge Two and Voice Record Pro. You can calibrate manual preamp gain, toggle automatic gain control, skip silence with voice activity detection, encrypt recordings locally with AES 256 GCM, and synchronize your audio to Dropbox, Google Drive, iCloud, Evernote, and email.',
    sections: [
      {
        title: '1. One-Tap Recording & Hardware Input',
        content: 'Select your audio source (Built-in mic, External USB interface, Bluetooth headset, or Loopback). Press the red record button to capture high-definition PCM audio with 60 FPS oscilloscope and dual stereo VU peak meters.'
      },
      {
        title: '2. DSP Preamp Gain & AGC',
        content: 'Adjust preamp gain from 0.0x to 5.0x (+14 dB) to boost quiet speakers. Enable Automatic Gain Control (AGC) for real-time dynamic range compression and hard-limit anti-clipping protection.'
      },
      {
        title: '3. Voice Activity Detection (VAD) & Silence Skipping',
        content: 'Set silence threshold between -60 dB and -20 dB and silence hold time (500ms to 3000ms). When silent, the recorder pauses sample accumulation to conserve memory and storage.'
      },
      {
        title: '4. Zero-Knowledge Local Encryption',
        content: 'Encrypt your recordings before writing to disk using PBKDF2 (100,000 iterations) and AES-256-GCM. Passphrases are never sent to external servers or stored unencrypted.'
      },
      {
        title: '5. Multi-Cloud Synchronization & Scheduling',
        content: 'Sync directly to Dropbox, Google Drive, iCloud Drive, Evernote, Email, or Webhooks. Schedule automated backups immediately, every 15 minutes, hourly, or daily on Wi-Fi.'
      },
      {
        title: '6. In-App Audio Editing Suite',
        content: 'Inspect interactive waveforms, trim start and end points with millisecond accuracy, apply gain amplification, insert silence, and transcode between WAV, MP3, FLAC, M4A, and AMR.'
      },
      {
        title: '7. 21-Language Capstone Architecture Hub',
        content: 'Explore complete, production-grade source code across 21 programming environments including Core C++, Rust, Python, Go, Kotlin, Dart, C#, Java, PHP, Ruby, Bash, PowerShell, SQL, R, Scala, MATLAB, COBOL, and Assembly.'
      }
    ]
  },
  fr: {
    id: 'fr',
    name: 'French',
    nativeName: 'Français',
    bcp47: 'fr-FR',
    dir: 'ltr',
    title: 'KBT_Recorder — Guide d’utilisation professionnel complet',
    summary: 'Enregistreur vocal multi-cloud professionnel avec DSP temps réel, vumètre VU, chiffrement zero-knowledge, édition audio et pôle d’architecture capstone en 21 langages.',
    ttsSpeechText: 'Bienvenue sur KBT Recorder, une suite d’enregistrement vocal professionnelle inspirée de RecForge Two et Voice Record Pro. Calibrez le préampli manuel, activez le contrôle automatique de gain, ignorez les silences et synchronisez vers Dropbox, Google Drive et iCloud.',
    sections: [
      {
        title: '1. Enregistrement en un clic et sélection matérielle',
        content: 'Choisissez votre source audio (microphone interne, interface USB externe ou casque). Lancez l’enregistrement en capturant du PCM haute fidélité avec oscilloscope et vumètre stéréo à 60 images par seconde.'
      },
      {
        title: '2. Préamplificateur DSP et contrôle automatique de gain (AGC)',
        content: 'Ajustez le gain de 0,0x à 5,0x (+14 dB) pour amplifier les voix faibles. Activez l’AGC pour une compression dynamique évitant la saturation numérique.'
      },
      {
        title: '3. Détection d’activité vocale (VAD) et saut de silence',
        content: 'Définissez le seuil de silence entre -60 dB et -20 dB. Lors des silences prolongés, l’enregistreur suspend la capture pour économiser l’espace mémoire.'
      },
      {
        title: '4. Chiffrement local Zero-Knowledge (AES-256-GCM)',
        content: 'Chiffrez vos enregistrements en mémoire à l’aide de PBKDF2 (100 000 itérations) et AES-256-GCM. Les mots de passe ne quittent jamais votre appareil.'
      },
      {
        title: '5. Synchronisation multi-cloud et sauvegardes planifiées',
        content: 'Exportez directement vers Dropbox, Google Drive, iCloud Drive, Evernote et Email avec vérification d’intégrité signée par HMAC-SHA256.'
      },
      {
        title: '6. Éditeur audio intégré et conversion de formats',
        content: 'Découpez vos pistes avec précision temporelle, amplifiez le signal et convertissez entre WAV, MP3, FLAC, M4A et AMR sans perte de clarté.'
      }
    ]
  },
  de: {
    id: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    bcp47: 'de-DE',
    dir: 'ltr',
    title: 'KBT_Recorder — Umfassendes Benutzerhandbuch',
    summary: 'Professioneller Sprachrekorder mit Echtzeit-DSP, VU-Metern, Zero-Knowledge-Verschlüsselung, Audio-Editor und 21-Sprachen-Architektur-Hub.',
    ttsSpeechText: 'Willkommen bei KBT Recorder, der professionellen Audio-Aufnahme-Suite. Nutzen Sie manuelle Vorverstärkung, automatische Pegelsteuerung, Stille-Erkennung und Zero-Knowledge-Verschlüsselung für Ihre Aufnahmen.',
    sections: [
      {
        title: '1. Schnellaufnahme & Hardwareauswahl',
        content: 'Wählen Sie Mikrofon, USB-Audio-Interface oder Headset. Nehmen Sie PCM-Audio in Studioqualität auf, begleitet von Echtzeit-Oszilloskop und Stereo-VU-Spitzenpegelanzeige.'
      },
      {
        title: '2. DSP Vorverstärkung & AGC',
        content: 'Regeln Sie den Gain von 0,0x bis 5,0x (+14 dB) oder aktivieren Sie die automatische Verstärkungsregelung (AGC) für konstanten Sprachpegel.'
      },
      {
        title: '3. Sprachaktivitätserkennung (VAD) & Stilleüberspringung',
        content: 'Vermeiden Sie Speicherverschwendung durch automatische Erkennung und Überspringen von Sprechpausen mit Schwellenwerten von -60 dB bis -20 dB.'
      },
      {
        title: '4. Lokale Zero-Knowledge-Verschlüsselung',
        content: 'Sichern Sie sensible Aufnahmen mit AES-256-GCM und PBKDF2 mit 100.000 Runden. Entschlüsselung erfolgt rein clientseitig.'
      },
      {
        title: '5. Multi-Cloud-Synchronisierung',
        content: 'Automatischer Export zu Dropbox, Google Drive, iCloud Drive, Evernote und E-Mail nach Zeitplan (sofort, alle 15 Minuten, stündlich oder täglich im WLAN).'
      }
    ]
  },
  es: {
    id: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    bcp47: 'es-ES',
    dir: 'ltr',
    title: 'KBT_Recorder — Guía de Usuario Profesional',
    summary: 'Grabadora de voz profesional multi-nube con DSP en tiempo real, vúmetros estéreo, cifrado de conocimiento cero y suite de edición de audio.',
    ttsSpeechText: 'Bienvenido a KBT Recorder, suite profesional de grabación de audio inspirada en RecForge Two y Voice Record Pro. Ajuste la ganancia del preamplificador, active la omisión de silencio y exporte a múltiples nubes.',
    sections: [
      {
        title: '1. Grabación con un toque e interfaz de hardware',
        content: 'Seleccione micrófono interno, interfaz USB o auriculares. Capture audio PCM sin compresión con visualizador osciloscopio y medidores VU estéreo a 60 FPS.'
      },
      {
        title: '2. Preamplificador DSP y Control Automático de Ganancia (AGC)',
        content: 'Ajuste la ganancia entre 0.0x y 5.0x (+14 dB) o habilite AGC para nivelación dinámica automática y protección contra saturación digital.'
      },
      {
        title: '3. Detección de Actividad de Voz (VAD) y Omisión de Silencio',
        content: 'Ahorre almacenamiento configurando el umbral de silencio de -60 dB a -20 dB para pausar la acumulación de datos durante silencios prolongados.'
      },
      {
        title: '4. Cifrado Local Zero-Knowledge (AES-256-GCM)',
        content: 'Proteja sus archivos con PBKDF2 (100,000 iteraciones) y AES-256-GCM. La clave secreta nunca sale de la memoria local de su dispositivo.'
      },
      {
        title: '5. Sincronización Multi-Nube y Exportación Programada',
        content: 'Envíe sus grabaciones a Dropbox, Google Drive, iCloud, Evernote y Correo Electrónico de forma instantánea o programada.'
      }
    ]
  },
  it: {
    id: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    bcp47: 'it-IT',
    dir: 'ltr',
    title: 'KBT_Recorder — Manuale Utente Completo',
    summary: 'Registratore vocale professionale con DSP in tempo reale, VU meter stereo, crittografia a conoscenza zero e sincronizzazione multi-cloud.',
    ttsSpeechText: 'Benvenuti in KBT Recorder. Configurate il guadagno del preamplificatore, attivate il controllo automatico del guadagno, saltate i silenzi ed esportate su Dropbox, Google Drive e iCloud.',
    sections: [
      {
        title: '1. Registrazione immediata e sorgenti audio',
        content: 'Scegliete microfono interno o esterno. Visualizzate in tempo reale forma d’onda oscilloscopio e VU meter stereo con allarme di clipping digitale.'
      },
      {
        title: '2. Preamplificazione DSP e AGC',
        content: 'Incrementate il segnale fino a 5,0x (+14 dB) e utilizzate il compressore limitatore per garantire voci nitide senza distorsioni.'
      },
      {
        title: '3. Crittografia Zero-Knowledge AES-256',
        content: 'I file audio vengono crittografati in memoria con AES-256-GCM e derivazione di chiave PBKDF2 a 100.000 cicli prima del salvataggio.'
      }
    ]
  },
  pt: {
    id: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    bcp47: 'pt-BR',
    dir: 'ltr',
    title: 'KBT_Recorder — Guia do Usuário Profissional',
    summary: 'Gravador de voz profissional multi-nuvem com processamento digital de sinal, medidores VU estéreo e criptografia de conhecimento zero.',
    ttsSpeechText: 'Bem-vindo ao KBT Recorder. Configure o ganho manual de pré-amplificação, use o controle automático de ganho, pule trechos de silêncio e sincronize com a nuvem com segurança total.',
    sections: [
      {
        title: '1. Gravação em Um Toque e Hardware',
        content: 'Selecione microfone embutido, interface USB ou fone Bluetooth. Grave áudio PCM cristalino com osciloscópio e vúmetros estéreo em tempo real.'
      },
      {
        title: '2. Pré-amplificador DSP e Detecção de Voz',
        content: 'Regule o ganho até 5,0x (+14 dB) e habilite o salto automático de silêncio para economizar espaço de armazenamento.'
      },
      {
        title: '3. Criptografia AES-256-GCM e Nuvem',
        content: 'Proteja seus áudios com criptografia local e sincronize com Dropbox, Google Drive, iCloud e Evernote.'
      }
    ]
  },
  id: {
    id: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    bcp47: 'id-ID',
    dir: 'ltr',
    title: 'KBT_Recorder — Panduan Pengguna Profesional',
    summary: 'Perekam suara multi-cloud tingkat lanjut dengan pemrosesan sinyal digital (DSP), VU meter, enkripsi lokal zero-knowledge, dan editor audio.',
    ttsSpeechText: 'Selamat datang di KBT Recorder. Gunakan kontrol penguatan manual, lewati keheningan otomatis, enkripsi rekaman Anda dengan aman, dan simpan ke Dropbox atau Google Drive.',
    sections: [
      {
        title: '1. Perekaman Sekali Sentuh',
        content: 'Pilih mikrofon bawaan atau antarmuka audio USB eksternal. Rekam audio kualitas studio dengan osiloskop dan VU meter stereo waktu nyata.'
      },
      {
        title: '2. Penguatan Preamp & Lewati Hening (VAD)',
        content: 'Tingkatkan suara lembut dengan gain hingga 5.0x (+14 dB) dan aktifkan VAD untuk menghilangkan bagian tanpa suara secara otomatis.'
      },
      {
        title: '3. Enkripsi Lokal & Sinkronisasi Cloud',
        content: 'Enkripsi berkas audio menggunakan AES-256-GCM sebelum disimpan, dan ekspor ke Google Drive, Dropbox, atau email dengan mudah.'
      }
    ]
  },
  sw: {
    id: 'sw',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    bcp47: 'sw-KE',
    dir: 'ltr',
    title: 'KBT_Recorder — Mwongozo Kamili wa Mtumiaji',
    summary: 'Kirekodi sauti cha kitaalamu chenye usindikaji wa sauti wa kidijitali (DSP), mita za VU, usimbaji fiche salama, na usawazishaji wa wingu.',
    ttsSpeechText: 'Karibu kwenye KBT Recorder. Rekodi sauti safi ya kitaalamu, rekebisha kikuza sauti, ruka ukimya kiotomatiki, na uhifadhi kwenye wingu kwa usalama wa hali ya juu.',
    sections: [
      {
        title: '1. Kurekodi kwa Mguso Mmoja',
        content: 'Chagua maikrofoni ya kifaa au USB ya nje. Rekodi sauti ya hali ya juu ukitumia mita za VU za stereo zinazoonyesha kiwango cha sauti papo hapo.'
      },
      {
        title: '2. Udhibiti wa Kikuza Sauti na Kuruka Ukimya',
        content: 'Rekebisha kiwango cha sauti hadi 5.0x na uwashe mfumo wa kutambua usemi (VAD) ili kuzuia kurekodi kimya kisicho na maana.'
      },
      {
        title: '3. Usimbaji Fiche wa AES-256 na Hifadhi ya Wingu',
        content: 'Linda rekodi zako kwa nenosiri la siri kabla ya kuzisafirisha kwenda Dropbox, Google Drive au iCloud.'
      }
    ]
  },
  tr: {
    id: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    bcp47: 'tr-TR',
    dir: 'ltr',
    title: 'KBT_Recorder — Kapsamlı Profesyonel Kullanım Kılavuzu',
    summary: 'Gerçek zamanlı DSP, stereo VU metreler, sıfır bilgi şifreleme ve çoklu bulut senkronizasyonlu profesyonel ses kaydedici.',
    ttsSpeechText: 'KBT Recorder uygulamasına hoş geldiniz. Manuel kazanç kontrolü yapabilir, sessizlik atlama özelliğini kullanabilir ve ses dosyalarınızı AES 256 ile şifreleyebilirsiniz.',
    sections: [
      {
        title: '1. Tek Dokunuşla Kayıt ve Donanım Girişi',
        content: 'Dahili veya harici USB mikrofonunuzu seçin. Gerçek zamanlı osiloskop ve stereo VU tepe ölçer ile yüksek çözünürlüklü PCM kaydı yapın.'
      },
      {
        title: '2. DSP Ön Yükselteç ve Otomatik Kazanç (AGC)',
        content: 'Fısıltıları güçlendirmek için kazancı 0.0x ile 5.0x (+14 dB) arasında ayarlayın veya dijital kırpmayı önleyen AGC sistemini açın.'
      },
      {
        title: '3. Sıfır Bilgi Şifreleme ve Bulut Aktarımı',
        content: 'Kayıtlarınızı AES-256-GCM ile cihazınızda şifreleyin ve Dropbox, Google Drive veya iCloud ile güvenle senkronize edin.'
      }
    ]
  },
  ru: {
    id: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    bcp47: 'ru-RU',
    dir: 'ltr',
    title: 'KBT_Recorder — Полное руководство пользователя',
    summary: 'Профессиональный диктофон с аппаратной обработкой DSP, стерео VU-метрами, локальным шифрованием AES-256 и синхронизацией с облачными сервисами.',
    ttsSpeechText: 'Добро пожаловать в KBT Recorder. Профессиональная запись звука студийного качества, ручная настройка гейна, пропуск тишины и локальное шифрование файлов.',
    sections: [
      {
        title: '1. Запись в одно касание и выбор источника',
        content: 'Подключите встроенный или внешний USB-микрофон. Записывайте чистый PCM-звук с мониторингом уровня через стерео VU-метры со скоростью 60 кадров в секунду.'
      },
      {
        title: '2. DSP-предусилитель и АРУ (AGC)',
        content: 'Регулируйте гейн от 0.0x до 5.0x (+14 дБ) или включите автоматическую регулировку усиления для защиты от клиппинга.'
      },
      {
        title: '3. Детекция речи (VAD) и шифрование Zero-Knowledge',
        content: 'Автоматический пропуск тишины экономит память. Шифрование AES-256-GCM защищает записи прямо в памяти устройства.'
      }
    ]
  },
  zh: {
    id: 'zh',
    name: 'Chinese',
    nativeName: '中文 (简体)',
    bcp47: 'zh-CN',
    dir: 'ltr',
    title: 'KBT_Recorder — 专业级多平台录音与云同步用户指南',
    summary: '专业级多云端语音录音系统，具备实时数字信号处理 (DSP)、双声道 VU 电平表、零知识本地加密和内置音频剪辑工具。',
    ttsSpeechText: '欢迎使用 KBT 录音机。您可以手动调节前级放大增益，开启自动增益与静音跳过功能，使用 AES 256 加密保护本地录音，并轻松同步至多个云存储。',
    sections: [
      {
        title: '1. 一键专业录音与硬件源选择',
        content: '自由选择内置麦克风、外接专业 USB 音频接口或蓝牙耳机。实时示波器与双声道 VU 峰值表以 60 FPS 刷新，精准提示数字削波失真。'
      },
      {
        title: '2. DSP 模拟前级放大与自动增益控制 (AGC)',
        content: '提供 0.0x 至 5.0x (+14 dB) 增益微调，可将微弱耳语放大至清晰可辨；开启硬件级 AGC 压缩限幅器，防止过载爆音。'
      },
      {
        title: '3. 语音活动检测 (VAD) 与智能静音跳过',
        content: '设定 -60 dB 至 -20 dB 阈值。长时间会议或夜间监听期间，系统将在无声状态下自动暂停采样累积，极大节省磁盘空间。'
      },
      {
        title: '4. 零知识本地高强度加密 (AES-256-GCM)',
        content: '基于 PBKDF2（100,000 次哈希迭代）和 AES-256-GCM 对音频切片进行内存加密。密码永不上传云端，离线绝对安全。'
      },
      {
        title: '5. 多云同步与定时自动导出',
        content: '原生对接 Dropbox、Google Drive、iCloud Drive、Evernote 与电子邮件，支持即时或定时按计划自动备份。'
      }
    ]
  },
  ja: {
    id: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    bcp47: 'ja-JP',
    dir: 'ltr',
    title: 'KBT_Recorder — プロフェッショナル音声録音＆クラウド同期ユーザーガイド',
    summary: 'リアルタイムDSP、ステレオVUメーター、ゼロ知識暗号化、オーディオ編集機能を備えたマルチプラットフォーム録音スイート。',
    ttsSpeechText: 'KBTレコーダーへようこそ。リアルタイムのプリアンプゲイン調整、無音スキップ、AES 256ローカル暗号化、DropboxやGoogleドライブへの自動同期に対応しています。',
    sections: [
      {
        title: '1. ワンタップ高音質録音と入力デバイス選択',
        content: '内蔵マイクまたは外付けUSBインターフェースを選択し、60FPSで動作するオシロスコープとデュアルVUメーターでクリッピングを監視しながら録音します。'
      },
      {
        title: '2. DSPプリアンプと自動ゲイン制御 (AGC)',
        content: '微小な音声を最大5.0倍(+14dB)まで増幅可能。AGCリミッターにより大音量時の音割れを防止します。'
      },
      {
        title: '3. 無音自動スキップとAES-256ゼロ知識暗号化',
        content: '発話検知(VAD)で無音区間を自動スキップし容量を節約。暗号化パスフレーズにより端末内保存ファイルを強固に保護します。'
      }
    ]
  },
  ar: {
    id: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    bcp47: 'ar-SA',
    dir: 'rtl',
    title: 'دليل المستخدم الاحترافي لتطبيق KBT_Recorder',
    summary: 'مسجل صوتي احترافي يدعم معالجة الإشارات الرقمية DSP في الوقت الفعلي، ومقاييس VU، والتشفير المحلي الآمن، والمزامنة السحابية المتعددة.',
    ttsSpeechText: 'مرحبًا بك في مسجل كي بي تي ريكوردر. يمكنك ضبط مضخم الصوت يدويًا، وتخطي الصمت تلقائيًا، وتشفير تسجيلاتك محليًا بأعلى درجات الأمان والمزامنة مع دروب بوكس وجوجل درايف.',
    sections: [
      {
        title: '1. التسجيل بلمسة واحدة واختيار الميكروفون',
        content: 'اختر ميكروفون الهاتف الداخلي أو ميكروفون USB احترافي خارجي. راقب مستويات الصوت عبر راسم الإشارة ومقاييس VU الحقيقية.'
      },
      {
        title: '2. مضخم الصوت الرقمي والتحكم التلقائي في الكسب (AGC)',
        content: 'اضبط الكسب بين 0.0x و 5.0x لرفع الأصوات الهادئة، واستخدم محدد الصوت لمنع التشويش الرقمي.'
      },
      {
        title: '3. تخطي الصمت والتشفير الآمن AES-256',
        content: 'يتوقف التسجيل تلقائيًا أثناء فترات الصمت لتوفير المساحة، مع تشفير البيانات محليًا قبل حفظها.'
      }
    ]
  },
  ur: {
    id: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    bcp47: 'ur-PK',
    dir: 'rtl',
    title: 'کے بی ٹی ریکارڈر — جامع پروفیشنل صارف گائیڈ',
    summary: 'پیشہ ورانہ آواز ریکارڈر مع ریئل ٹائم ڈی ایس پی، وی یو میٹرز، محفوظ ترین انکرپشن اور ملٹی کلاؤڈ سنکرونائزیشن۔',
    ttsSpeechText: 'کے بی ٹی ریکارڈر میں خوش آمدید۔ آپ آواز کی بلندی کو دستی طور پر ترتیب دے سکتے ہیں، خاموشی کو خودکار طور پر چھوڑ سکتے ہیں، اور اپنی ریکارڈنگز کو محفوظ ترین انداز میں محفوظ کر سکتے ہیں۔',
    sections: [
      {
        title: '1. ایک کلک پر ریکارڈنگ اور مائیک کا انتخاب',
        content: 'اندرونی یا بیرونی یو ایس بی مائیکروفون منتخب کریں اور حقیقی وقت میں آواز کے گراف اور لیولز پر نظر رکھیں۔'
      },
      {
        title: '2. خودکار گین کنٹرول اور خاموشی چھوڑنے کا نظام',
        content: 'مدہم آوازوں کو 5 گنا تک بڑھائیں اور لمبی خاموشی کے دوران خودکار وقفے کے ذریعے میموری کی بچت کریں۔'
      },
      {
        title: '3. محفوظ ترین انکرپشن اور کلاؤڈ بیک اپ',
        content: 'اپنی ریکارڈنگز کو پاس ورڈ کے ساتھ انکرپٹ کریں اور ڈراپ باکس، گوگل ڈرائیو یا ای میل پر باآسانی برآمد کریں۔'
      }
    ]
  },
  hi: {
    id: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    bcp47: 'hi-IN',
    dir: 'ltr',
    title: 'KBT_Recorder — विस्तृत प्रो यूज़र गाइड',
    summary: 'रीयल-टाइम डीएसपी, स्टीरियो वीयू मीटर, जीरो-नॉलेज एन्क्रिप्शन और मल्टी-क्लाउड सिंक वाला प्रोफेशनल वॉयस रिकॉर्डर।',
    ttsSpeechText: 'केबीटी रिकॉर्डर में आपका स्वागत है। प्रीएम्प गेन को मैनुअल रूप से समायोजित करें, स्वचालित गेन नियंत्रण सक्षम करें, चुप्पी को छोड़ें और अपनी रिकॉर्डिंग को सुरक्षित रूप से क्लाउड पर सहेजें।',
    sections: [
      {
        title: '1. एक टैप से रिकॉर्डिंग और माइक्रोफ़ोन चयन',
        content: 'इनबिल्ट माइक या बाहरी यूएसबी माइक्रोफ़ोन चुनें। 60 एफपीएस ऑसिलोस्कोप और स्टीरियो वीयू मीटर के साथ स्पष्ट पीसीएम ऑडियो रिकॉर्ड करें।'
      },
      {
        title: '2. डीएसपी प्रीएम्प गेन और चुप्पी छोड़ना (VAD)',
        content: 'धीमी आवाज़ को 5.0 गुना तक बढ़ाएं और लंबे समय तक चुप्पी रहने पर रिकॉर्डिंग स्वतः रोककर स्टोरेज बचाएं।'
      },
      {
        title: '3. ज़ीरो-नॉलेज एन्क्रिप्शन और क्लाउड सिंक',
        content: 'रिकॉर्डिंग को एईएस-256 के साथ सुरक्षित रखें और ड्रॉपबॉक्स, गूगल ड्राइव या आईक्लाउड पर तुरंत भेजें।'
      }
    ]
  },
  vi: {
    id: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    bcp47: 'vi-VN',
    dir: 'ltr',
    title: 'KBT_Recorder — Hướng Dẫn Sử Dụng Chuyên Nghiệp',
    summary: 'Ứng dụng ghi âm chuyên nghiệp đa đám mây với DSP thời gian thực, đồng hồ đo VU stereo, mã hóa zero-knowledge và bộ chỉnh sửa âm thanh.',
    ttsSpeechText: 'Chào mừng bạn đến với KBT Recorder. Tùy chỉnh độ lợi tiền khuếch đại, bỏ qua khoảng lặng thông minh, mã hóa dữ liệu cục bộ và đồng bộ hóa đám mây an toàn.',
    sections: [
      {
        title: '1. Ghi âm một chạm và chọn thiết bị phần cứng',
        content: 'Chọn micrô tích hợp hoặc mic USB chuyên nghiệp ngoài. Theo dõi dạng sóng âm và đồng hồ đo VU stereo ở tốc độ 60 khung hình/giây.'
      },
      {
        title: '2. Tăng cường âm thanh DSP & Tự động bỏ qua im lặng',
        content: 'Tăng âm lượng giọng nói nhỏ lên tới 5.0x (+14 dB) và kích hoạt VAD để loại bỏ các đoạn im lặng không cần thiết.'
      },
      {
        title: '3. Mã hóa Zero-Knowledge và Đồng bộ hóa đám mây',
        content: 'Bảo vệ bản ghi bằng thuật toán AES-256-GCM và xuất trực tiếp sang Dropbox, Google Drive hoặc email.'
      }
    ]
  },
  ko: {
    id: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    bcp47: 'ko-KR',
    dir: 'ltr',
    title: 'KBT_Recorder — 전문가용 음성 녹음기 사용자 가이드',
    summary: '실시간 DSP 오디오 처리, 듀얼 VU 레벨 미터, 제로 놀리지 로컬 암호화 및 멀티 클라우드 동기화 기능을 갖춘 전문가급 보이스 레코더.',
    ttsSpeechText: 'KBT 레코더에 오신 것을 환영합니다. 수동 프리앰프 게인 조정, 무음 구간 자동 건너뛰기, AES 256 암호화 및 다양한 클라우드 저장소 연동을 지원합니다.',
    sections: [
      {
        title: '1. 원터치 녹음 및 마이크 하드웨어 설정',
        content: '기본 마이크 또는 외장 USB 마이크를 선택하고 60 FPS 실시간 오실로스코프 파형과 스테레오 VU 미터를 모니터링하며 녹음합니다.'
      },
      {
        title: '2. DSP 프리앰프 게인 및 음성 감지(VAD)',
        content: '작은 목소리를 최대 5.0배(+14 dB)까지 깨끗하게 증폭하고, 무음 감지 시스템을 통해 침묵 구간을 자동으로 건너뜁니다.'
      },
      {
        title: '3. 로컬 제로 놀리지 암호화 및 다중 클라우드 백업',
        content: 'AES-256-GCM 알고리즘으로 기기 내에서 안전하게 암호화하며, 드롭박스, 구글 드라이브, 아이클라우드로 간편하게 전송할 수 있습니다.'
      }
    ]
  },
  fa: {
    id: 'fa',
    name: 'Farsi/Persian',
    nativeName: 'فارسی',
    bcp47: 'fa-IR',
    dir: 'rtl',
    title: 'راهنمای جامع کاربری KBT_Recorder',
    summary: 'ضبط‌کننده حرفه‌ای صدا با پردازش بلادرنگ سیگنال، نشانگرهای سطح صدا، رمزنگاری پیشرفته و همگام‌سازی ابری.',
    ttsSpeechText: 'به برنامه ضبط صدای کی بی تی خوش آمدید. کنترل دستی سطح ورودی صدا، پرش از روی سکوت و رمزنگاری داده‌ها را با امنیت کامل تجربه کنید.',
    sections: [
      {
        title: '۱. ضبط با یک کلیک و انتخاب میکروفون',
        content: 'میکروفون داخلی یا دستگاه خارجی USB را انتخاب کرده و سطوح صدا را به صورت لحظه‌ای بررسی کنید.'
      },
      {
        title: '۲. تقویت سیگنال صوتی و حذف سکوت',
        content: 'صداهای آرام را تقویت کرده و با سامانه هوشمند تشخیص صدا، زمان‌های سکوت را بدون اشغال حافظه رد کنید.'
      },
      {
        title: '۳. رمزنگاری محلی و ذخیره‌سازی ابری',
        content: 'فایل‌های صوتی را با استاندارد امنیتی AES-256 رمزگذاری کرده و به دراپ‌باکس و گوگل درایو ارسال نمایید.'
      }
    ]
  },
  mr: {
    id: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    bcp47: 'mr-IN',
    dir: 'ltr',
    title: 'KBT_Recorder — सर्वसमावेशक वापरकर्ता मार्गदर्शक',
    summary: 'रिअल-टाइम डीएसपी, स्टिरिओ व्हीयू मीटर्स, सुरक्षित स्थानिक एन्क्रिप्शन आणि मल्टी-क्लाउड स्टोरेजसह व्यावसायिक व्हॉइस रेकॉर्डर.',
    ttsSpeechText: 'केबीटी रेकॉर्डरमध्ये आपले स्वागत आहे. अचूक ऑडिओ रेकॉर्डिंग, आवाज वाढवणे, शांतता वगळणे आणि सुरक्षित क्लाउड बॅकअपचा लाभ घ्या.',
    sections: [
      {
        title: '१. एका स्पर्शात रेकॉर्डिंग आणि माइक निवड',
        content: 'इनबिल्ट माइक किंवा बाह्य यूएसबी माइक निवडून उच्च गुणवत्तेचा ऑडिओ रेकॉर्ड करा आणि वेव्हफॉर्म तपासा.'
      },
      {
        title: '२. डीएसपी गेन आणि शांतता वगळणे',
        content: 'कमी आवाजाला स्पष्ट करण्यासाठी गेन ५ पटीने वाढवा आणि न बोललेल्या शांत जागा आपोआप वगळा.'
      },
      {
        title: '३. सुरक्षित एन्क्रिप्शन आणि क्लाउड सेव्हिंग',
        content: 'आपल्या गोपनीय नोंदी पासवर्डसह एन्क्रिप्ट करा आणि थेट गुगल ड्राइव्ह किंवा ईमेलवर पाठवा.'
      }
    ]
  },
  bn: {
    id: 'bn',
    name: 'Bangla/Bengali',
    nativeName: 'বাংলা',
    bcp47: 'bn-BD',
    dir: 'ltr',
    title: 'KBT_Recorder — সম্পূর্ণ পেশাদার ব্যবহারকারী নির্দেশিকা',
    summary: 'রিয়েল-টাইম ডিএসপি, ডুয়াল ভিইউ মিটার, জিরো-নলেজ এনক্রিপশন এবং মাল্টি-ক্লাউড সিঙ্ক সমৃদ্ধ প্রফেশনাল ভয়েস রেকর্ডার।',
    ttsSpeechText: 'কেবিটি রেকর্ডারে আপনাকে স্বাগতম। শব্দ সংকেত পরিবর্ধন করুন, অপ্রয়োজনীয় নীরবতা এড়িয়ে চলুন এবং নিরাপদে গুগল ড্রাইভ ও ড্রপবক্সে সংরক্ষণ করুন।',
    sections: [
      {
        title: '১. এক ট্যাপে রেকর্ডিং ও ইনপুট বাছাই',
        content: 'ডিভাইস মাইক অথবা বাহ্যিক ইউএসবি মাইক্রোফোন বেছে নিন এবং রিয়েল-টাইম স্টিরিও মিটারের সাহায্যে শব্দ নিয়ন্ত্রণ করুন।'
      },
      {
        title: '২. প্রি-অ্যাম্প গেইন ও নীরবতা বর্জন (VAD)',
        content: 'মৃদু কণ্ঠস্বর ৫ গুণ পর্যন্ত বৃদ্ধি করুন এবং দীর্ঘ নীরবতা বাদ দিয়ে মেমরি সাশ্রয় করুন।'
      },
      {
        title: '৩. লোকাল এনক্রিপশন ও ক্লাউড ব্যাকআপ',
        content: 'এইএস-২৫৬ অ্যালগরিদম দিয়ে অডিও ফাইল সুরক্ষিত রাখুন এবং ড্রপবক্স ও গুগল ড্রাইভে স্থানান্তর করুন।'
      }
    ]
  },
  ta: {
    id: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    bcp47: 'ta-IN',
    dir: 'ltr',
    title: 'KBT_Recorder — முழுமையான பயனர் கையேடு',
    summary: 'நிகழ்நேர டிஎஸ்பி, ஸ்டீரியோ வி.யு மீட்டர்கள், அதிநவீன உள்ளூர் குறியாக்க முறை மற்றும் பல கிளவுட் சேமிப்பக வசதி கொண்ட தொழில்முறை ஒலிப்பதிவு கருவி.',
    ttsSpeechText: 'கேபிடி ரெக்கார்டருக்கு நல்வரவு. உயர்தர ஒலிப்பதிவு, சத்தம் பெருக்கி, மௌனப் பகுதிகளைத் தவிர்த்தல் மற்றும் பாதுகாப்பான கிளவுட் சேமிப்பை எளிதாகப் பயன்படுத்துங்கள்.',
    sections: [
      {
        title: '1. ஒரு தொடுதலில் பதிவு செய்தல்',
        content: 'உள்ளமைக்கப்பட்ட அல்லது வெளிப்புற மைக்ரோஃபோனைத் தேர்ந்தெடுத்து, துல்லியமான அலைவரிசை மற்றும் வி.யு மீட்டர்களுடன் பதிவைத் தொடங்குங்கள்.'
      },
      {
        title: '2. ஒலி பெருக்கி மற்றும் மௌனம் தவிர்த்தல்',
        content: 'குறைந்த குரல்களை 5 மடங்கு வரை உயர்த்தி, பேச்சற்ற அமைதியான தருணங்களைத் தானாகத் தவிர்த்து நினைவகத்தைச் சேமிக்கவும்.'
      },
      {
        title: '3. ஏஇஎஸ்-256 குறியாக்கம் மற்றும் கிளவுட் பகிர்வு',
        content: 'உங்கள் ஆடியோ பதிவுகளை முழுமையாகக் குறியாக்கம் செய்து டிராப்பாக்ஸ் மற்றும் கூகுள் டிரைவிற்கு எளிதாக அனுப்பவும்.'
      }
    ]
  },
  te: {
    id: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    bcp47: 'te-IN',
    dir: 'ltr',
    title: 'KBT_Recorder — సమగ్ర ప్రొఫెషనల్ యూజర్ గైడ్',
    summary: 'రియల్-టైమ్ డీఎస్పీ, డ్యూయల్ వియూ మీటర్లు, సురక్షితమైన ఎన్‌క్రిప్షన్ మరియు మల్టీ-క్లౌడ్ సింక్‌తో కూడిన అత్యాధునిక వాయిస్ రికార్డర్.',
    ttsSpeechText: 'కేబీటీ రికార్డర్‌కు స్వాగతం. ప్రీయాంప్ గెయిన్ సర్దుబాటు చేయండి, నిశ్శబ్ద సమయాన్ని దాటవేయండి మరియు మీ రికార్డింగ్‌లను సురక్షితంగా క్లౌడ్‌లో భద్రపరుచుకోండి.',
    sections: [
      {
        title: '1. సింగిల్ ట్యాప్ రికార్డింగ్ & మైక్ ఎంపిక',
        content: 'అంతర్గత మైక్ లేదా బాహ్య యూఎస్‌బీ మైక్రోఫోన్‌ను ఎంచుకుని, రియల్-టైమ్ స్టీరియో మీటర్లతో స్పష్టమైన ఆడియోను రికార్డ్ చేయండి.'
      },
      {
        title: '2. డీఎస్పీ గెయిన్ కంట్రోల్ & నిశ్శబ్దం దాటవేత (VAD)',
        content: 'నెమ్మదిగా ఉన్న స్వరాన్ని 5 రెట్లు పెంచుకోండి మరియు ఎక్కువసేపు మాట్లాడని నిశ్శబ్ద సమయాన్ని ఆటోమేటిక్‌గా వదిలివేయండి.'
      },
      {
        title: '3. జీరో-నాలెడ్జ్ ఎన్‌క్రిప్షన్ & క్లౌడ్ స్టోరేజ్',
        content: 'మీ రికార్డింగ్‌లను ఏఈఎస్-256 తో లాక్ చేసి డ్రాప్‌బాక్స్ లేదా గూగుల్ డ్రైవ్‌కు నేరుగా ఎగుమతి చేయండి.'
      }
    ]
  }
};
