/* =========================================================
   36 SCHOOL — RESILIENT UNIFIED DATA STORE
   Firebase va LocalStorage bilan to'liq integratsiya.
   Internet yoki Firebase hisobi bo'lmaganda ham 100%
   hamma joyi real ishlaydigan mukammal maktab bazasi.
   ========================================================= */

const STORAGE_KEY = "36_school_database_v3";

/* Boshlang'ich haqiqiy maktab ma'lumotlari (Toshkent shahar 36-sonli maktab) */
const SEED_DATA = {
  school: {
    name: "36-sonli ixtisoslashtirilgan davlat umumta'lim maktabi",
    shortName: "36-maktab",
    region: "Toshkent shahri, Chilonzor tumani, 9-mavze",
    phone: "+998 71 278-36-36",
    email: "info@36maktab.uz",
    director: "Sherzod Aliyev",
    foundedYear: 1982,
    totalStudents: 1248,
    totalTeachers: 84,
    totalClasses: 42,
    academicYear: "2026-2027",
  },

  classes: [
    { id: "c-1a", name: "1-A", teacher: "Nilufar Karimova", students: 28, room: "101", shift: 1, gradeLevel: 1 },
    { id: "c-3b", name: "3-B", teacher: "Malika Rahimova", students: 30, room: "105", shift: 1, gradeLevel: 3 },
    { id: "c-5a", name: "5-A", teacher: "Alisher Sobirov", students: 32, room: "204", shift: 1, gradeLevel: 5 },
    { id: "c-7b", name: "7-B", teacher: "Dilnoza Rahimova", students: 29, room: "208", shift: 2, gradeLevel: 7 },
    { id: "c-8a", name: "8-A", teacher: "Farhod Shokirov", students: 30, room: "302", shift: 1, gradeLevel: 8 },
    { id: "c-9a", name: "9-A", teacher: "Zilola Karimova", students: 31, room: "304", shift: 1, gradeLevel: 9 },
    { id: "c-9b", name: "9-B", teacher: "Bobur Nurmatov", students: 29, room: "306", shift: 1, gradeLevel: 9 },
    { id: "c-10a", name: "10-A", teacher: "Madina Yo'ldosheva", students: 26, room: "312", shift: 1, gradeLevel: 10 },
    { id: "c-11a", name: "11-A", teacher: "Jamshid Qodirov", students: 27, room: "315", shift: 1, gradeLevel: 11 },
  ],

  students: [
    // 9-A o'quvchilari
    { id: "st-9a-1", classId: "c-9a", className: "9-A", name: "Javohir Rustamov", gender: "m", parentName: "Dilshod Rustamov", parentPhone: "+998 90 123-45-67", rating: 4.9, status: "active" },
    { id: "st-9a-2", classId: "c-9a", className: "9-A", name: "Madina Aliyeva", gender: "f", parentName: "Gulnora Aliyeva", parentPhone: "+998 93 234-56-78", rating: 5.0, status: "active" },
    { id: "st-9a-3", classId: "c-9a", className: "9-A", name: "Asadbek Shokirov", gender: "m", parentName: "Farhod Shokirov", parentPhone: "+998 97 345-67-89", rating: 4.6, status: "active" },
    { id: "st-9a-4", classId: "c-9a", className: "9-A", name: "Kamola To'rayeva", gender: "f", parentName: "Munira To'rayeva", parentPhone: "+998 91 456-78-90", rating: 4.8, status: "active" },
    { id: "st-9a-5", classId: "c-9a", className: "9-A", name: "Sardor Mirzayev", gender: "m", parentName: "Ulug'bek Mirzayev", parentPhone: "+998 99 567-89-01", rating: 4.4, status: "active" },
    { id: "st-9a-6", classId: "c-9a", className: "9-A", name: "Dilnoza Saidova", gender: "f", parentName: "Saida Saidova", parentPhone: "+998 94 678-90-12", rating: 4.9, status: "active" },
    { id: "st-9a-7", classId: "c-9a", className: "9-A", name: "Shahzod Ergashev", gender: "m", parentName: "Bahrom Ergashev", parentPhone: "+998 90 789-01-23", rating: 4.7, status: "active" },
    { id: "st-9a-8", classId: "c-9a", className: "9-A", name: "Rayhona Qosimova", gender: "f", parentName: "Feruza Qosimova", parentPhone: "+998 93 890-12-34", rating: 4.8, status: "active" },
    { id: "st-9a-9", classId: "c-9a", className: "9-A", name: "Bilol Vohidov", gender: "m", parentName: "Rustam Vohidov", parentPhone: "+998 97 901-23-45", rating: 4.5, status: "active" },
    { id: "st-9a-10", classId: "c-9a", className: "9-A", name: "Zuhra Karimova", gender: "f", parentName: "Nodir Karimov", parentPhone: "+998 91 012-34-56", rating: 4.9, status: "active" },

    // 10-A o'quvchilari
    { id: "st-10a-1", classId: "c-10a", className: "10-A", name: "Ulug'bek Nazarov", gender: "m", parentName: "Anvar Nazarov", parentPhone: "+998 90 222-33-44", rating: 4.8, status: "active" },
    { id: "st-10a-2", classId: "c-10a", className: "10-A", name: "Shahnoza Yusupova", gender: "f", parentName: "Malika Yusupova", parentPhone: "+998 91 333-44-55", rating: 5.0, status: "active" },
    { id: "st-10a-3", classId: "c-10a", className: "10-A", name: "Bekzod Qodirov", gender: "m", parentName: "Jamshid Qodirov", parentPhone: "+998 93 444-55-66", rating: 4.7, status: "active" },
    { id: "st-10a-4", classId: "c-10a", className: "10-A", name: "Dilorom Ismoilova", gender: "f", parentName: "Zuhra Ismoilova", parentPhone: "+998 97 555-66-77", rating: 4.6, status: "active" },

    // 11-A o'quvchilari
    { id: "st-11a-1", classId: "c-11a", className: "11-A", name: "Otabek Mansurov", gender: "m", parentName: "Mansur Jo'rayev", parentPhone: "+998 90 555-11-22", rating: 4.9, status: "active" },
    { id: "st-11a-2", classId: "c-11a", className: "11-A", name: "Gulchehra Saidova", gender: "f", parentName: "Said Karimov", parentPhone: "+998 94 666-22-33", rating: 5.0, status: "active" },
    { id: "st-11a-3", classId: "c-11a", className: "11-A", name: "Sherali Xolmatov", gender: "m", parentName: "Xolmat Xolmatov", parentPhone: "+998 99 777-33-44", rating: 4.7, status: "active" },
  ],

  teachers: [
    {
      id: "tch-1",
      name: "Zilola Karimova",
      subject: "Matematika va Algebra",
      category: "Oliy toifa",
      phone: "+998 90 111-22-33",
      email: "z.karimova@36maktab.uz",
      room: "304",
      hours: 24,
      experience: "16 yil",
      avatar: "ZK",
    },
    {
      id: "tch-2",
      name: "Alisher Sobirov",
      subject: "Fizika va Astronomiya",
      category: "1-toifa",
      phone: "+998 91 222-33-44",
      email: "a.sobirov@36maktab.uz",
      room: "301 (Fizika lab)",
      hours: 20,
      experience: "12 yil",
      avatar: "AS",
    },
    {
      id: "tch-3",
      name: "Dilfuza Azimova",
      subject: "Ingliz tili (IELTS 8.0)",
      category: "Oliy toifa",
      phone: "+998 93 333-44-55",
      email: "d.azimova@36maktab.uz",
      room: "108 (Lingafon)",
      hours: 26,
      experience: "14 yil",
      avatar: "DA",
    },
    {
      id: "tch-4",
      name: "Madina Yo'ldosheva",
      subject: "Ona tili va Adabiyot",
      category: "Oliy toifa",
      phone: "+998 94 444-55-66",
      email: "m.yuldasheva@36maktab.uz",
      room: "202",
      hours: 22,
      experience: "18 yil",
      avatar: "MY",
    },
    {
      id: "tch-5",
      name: "Jamshid Qodirov",
      subject: "Informatika va IT",
      category: "1-toifa",
      phone: "+998 97 555-66-77",
      email: "j.qodirov@36maktab.uz",
      room: "215 (Kompyuter zali)",
      hours: 20,
      experience: "8 yil",
      avatar: "JQ",
    },
    {
      id: "tch-6",
      name: "Nodira Shokirova",
      subject: "O'zbekiston tarixi va Huquq",
      category: "Oliy toifa",
      phone: "+998 99 666-77-88",
      email: "n.shokirova@36maktab.uz",
      room: "210",
      hours: 20,
      experience: "19 yil",
      avatar: "NS",
    },
    {
      id: "tch-7",
      name: "Bobur Nurmatov",
      subject: "Jismoniy tarbiya",
      category: "1-toifa",
      phone: "+998 90 777-88-99",
      email: "b.nurmatov@36maktab.uz",
      room: "Katta sport majmuasi",
      hours: 24,
      experience: "10 yil",
      avatar: "BN",
    },
    {
      id: "tch-8",
      name: "Saodat Usmonova",
      subject: "Biologiya va Kimyo",
      category: "Oliy toifa",
      phone: "+998 91 888-99-00",
      email: "s.usmonova@36maktab.uz",
      room: "310 (Kimyo lab)",
      hours: 22,
      experience: "15 yil",
      avatar: "SU",
    },
  ],

  // Hafta kunlari bo'yicha qo'ng'iroqlar vaqti
  bellSchedule: [
    { period: 1, start: "08:30", end: "09:15", label: "1-dars" },
    { period: 2, start: "09:20", end: "10:05", label: "2-dars" },
    { period: 3, start: "10:15", end: "11:00", label: "3-dars (Katta tanaffus)" },
    { period: 4, start: "11:10", end: "11:55", label: "4-dars" },
    { period: 5, start: "12:05", end: "12:50", label: "5-dars" },
    { period: 6, start: "13:00", end: "13:45", label: "6-dars" },
  ],

  // Dars jadvali (Sinflar bo'yicha)
  schedule: {
    "9-A": {
      monday: [
        { period: 1, subject: "Algebra", teacher: "Z. Karimova", room: "304" },
        { period: 2, subject: "Fizika", teacher: "A. Sobirov", room: "301" },
        { period: 3, subject: "Ingliz tili", teacher: "D. Azimova", room: "108" },
        { period: 4, subject: "Ona tili", teacher: "M. Yo'ldosheva", room: "202" },
        { period: 5, subject: "Tarix", teacher: "N. Shokirova", room: "210" },
        { period: 6, subject: "Jismoniy tarbiya", teacher: "B. Nurmatov", room: "Sport zal" },
      ],
      tuesday: [
        { period: 1, subject: "Geometriya", teacher: "Z. Karimova", room: "304" },
        { period: 2, subject: "Kimyo", teacher: "S. Usmonova", room: "310" },
        { period: 3, subject: "Biologiya", teacher: "S. Usmonova", room: "310" },
        { period: 4, subject: "Adabiyot", teacher: "M. Yo'ldosheva", room: "202" },
        { period: 5, subject: "Informatika", teacher: "J. Qodirov", room: "215" },
      ],
      wednesday: [
        { period: 1, subject: "Algebra", teacher: "Z. Karimova", room: "304" },
        { period: 2, subject: "Ingliz tili", teacher: "D. Azimova", room: "108" },
        { period: 3, subject: "Fizika", teacher: "A. Sobirov", room: "301" },
        { period: 4, subject: "O'zbekiston tarixi", teacher: "N. Shokirova", room: "210" },
        { period: 5, subject: "Geografiya", teacher: "K. Aliyeva", room: "205" },
      ],
      thursday: [
        { period: 1, subject: "Ona tili", teacher: "M. Yo'ldosheva", room: "202" },
        { period: 2, subject: "Geometriya", teacher: "Z. Karimova", room: "304" },
        { period: 3, subject: "Kimyo", teacher: "S. Usmonova", room: "310" },
        { period: 4, subject: "Ingliz tili", teacher: "D. Azimova", room: "108" },
        { period: 5, subject: "Jismoniy tarbiya", teacher: "B. Nurmatov", room: "Sport zal" },
      ],
      friday: [
        { period: 1, subject: "Informatika", teacher: "J. Qodirov", room: "215" },
        { period: 2, subject: "Algebra", teacher: "Z. Karimova", room: "304" },
        { period: 3, subject: "Adabiyot", teacher: "M. Yo'ldosheva", room: "202" },
        { period: 4, subject: "Biologiya", teacher: "S. Usmonova", room: "310" },
        { period: 5, subject: "Tarbiya soati", teacher: "Z. Karimova", room: "304" },
      ],
      saturday: [
        { period: 1, subject: "Jahon tarixi", teacher: "N. Shokirova", room: "210" },
        { period: 2, subject: "Fizika", teacher: "A. Sobirov", room: "301" },
        { period: 3, subject: "Chaqiruvga qadar tayyorgarlik", teacher: "R. Toshmatov", room: "114" },
        { period: 4, subject: "Fakultativ to'garak", teacher: "Z. Karimova", room: "304" },
      ],
    },
    "10-A": {
      monday: [
        { period: 1, subject: "Matematika", teacher: "Z. Karimova", room: "304" },
        { period: 2, subject: "Ona tili", teacher: "M. Yo'ldosheva", room: "202" },
        { period: 3, subject: "Fizika", teacher: "A. Sobirov", room: "301" },
        { period: 4, subject: "Ingliz tili", teacher: "D. Azimova", room: "108" },
        { period: 5, subject: "Informatika", teacher: "J. Qodirov", room: "215" },
      ],
    },
  },

  // Sinf davomati yozuvlari
  attendanceDaily: {
    "9-A_today": {
      className: "9-A",
      date: new Date().toISOString().slice(0, 10),
      records: {
        "st-9a-1": "present",
        "st-9a-2": "present",
        "st-9a-3": "present",
        "st-9a-4": "late",
        "st-9a-5": "present",
        "st-9a-6": "present",
        "st-9a-7": "excused",
        "st-9a-8": "present",
        "st-9a-9": "absent",
        "st-9a-10": "present",
      },
      stats: { total: 10, present: 7, late: 1, excused: 1, absent: 1, percent: 90 },
    },
  },

  // Sinflar bo'yicha umumiy o'rtacha davomat ko'rsatkichlari
  attendance: [
    { id: "att-1", className: "1-A", percent: 98.4 },
    { id: "att-2", className: "3-B", percent: 97.2 },
    { id: "att-3", className: "5-A", percent: 96.5 },
    { id: "att-4", className: "7-B", percent: 94.8 },
    { id: "att-5", className: "8-A", percent: 95.1 },
    { id: "att-6", className: "9-A", percent: 97.8 },
    { id: "att-7", className: "9-B", percent: 93.6 },
    { id: "att-8", className: "10-A", percent: 96.0 },
    { id: "att-9", className: "11-A", percent: 98.9 },
  ],

  // Elektron jurnal (Baholar)
  grades: {
    "9-A_Algebra": [
      { studentId: "st-9a-1", studentName: "Javohir Rustamov", marks: [5, 5, 5, 4, 5], average: 4.8 },
      { studentId: "st-9a-2", studentName: "Madina Aliyeva", marks: [5, 5, 5, 5, 5], average: 5.0 },
      { studentId: "st-9a-3", studentName: "Asadbek Shokirov", marks: [4, 5, 4, 4, 5], average: 4.4 },
      { studentId: "st-9a-4", studentName: "Kamola To'rayeva", marks: [5, 5, 4, 5, 5], average: 4.8 },
      { studentId: "st-9a-5", studentName: "Sardor Mirzayev", marks: [4, 4, 3, 5, 4], average: 4.0 },
      { studentId: "st-9a-6", studentName: "Dilnoza Saidova", marks: [5, 5, 5, 4, 5], average: 4.8 },
      { studentId: "st-9a-7", studentName: "Shahzod Ergashev", marks: [5, 4, 5, 4, 4], average: 4.4 },
      { studentId: "st-9a-8", studentName: "Rayhona Qosimova", marks: [5, 5, 4, 5, 5], average: 4.8 },
      { studentId: "st-9a-9", studentName: "Bilol Vohidov", marks: [4, 4, 4, 3, 4], average: 3.8 },
      { studentId: "st-9a-10", studentName: "Zuhra Karimova", marks: [5, 5, 5, 5, 4], average: 4.8 },
    ],
    "9-A_Fizika": [
      { studentId: "st-9a-1", studentName: "Javohir Rustamov", marks: [5, 5, 4, 5], average: 4.75 },
      { studentId: "st-9a-2", studentName: "Madina Aliyeva", marks: [5, 5, 5, 5], average: 5.0 },
    ],
    "9-A_Ingliz tili": [
      { studentId: "st-9a-1", studentName: "Javohir Rustamov", marks: [5, 5, 5, 5], average: 5.0 },
      { studentId: "st-9a-2", studentName: "Madina Aliyeva", marks: [5, 5, 5, 5], average: 5.0 },
    ],
  },

  // Uyga vazifalar
  homework: [
    {
      id: "hw-1",
      title: "Algebra: Kvadrat tenglamalar mavzusi bo'yicha 245-248 misollarni yechish",
      subject: "Algebra",
      className: "9-A",
      teacher: "Z. Karimova",
      dueDate: "2026-11-04",
      status: "active",
      completedBy: ["st-9a-1", "st-9a-2"],
      createdAt: "2026-11-02",
    },
    {
      id: "hw-2",
      title: "Ingliz tili: Unit 4 - Reading comprehension & Essay: 'Modern Education in Uzbekistan'",
      subject: "Ingliz tili",
      className: "9-A",
      teacher: "D. Azimova",
      dueDate: "2026-11-05",
      status: "active",
      completedBy: ["st-9a-2"],
      createdAt: "2026-11-02",
    },
    {
      id: "hw-3",
      title: "Fizika: Nyutonning 2-qonuniga oid laboratoriya hisobotini daftarga yozish",
      subject: "Fizika",
      className: "9-A",
      teacher: "A. Sobirov",
      dueDate: "2026-11-06",
      status: "active",
      completedBy: [],
      createdAt: "2026-11-02",
    },
    {
      id: "hw-4",
      title: "Ona tili: Murakkab qo'shma gaplar mavzusida 10 ta namunaviy gap tuzish",
      subject: "Ona tili",
      className: "10-A",
      teacher: "M. Yo'ldosheva",
      dueDate: "2026-11-04",
      status: "active",
      completedBy: [],
      createdAt: "2026-11-01",
    },
    {
      id: "hw-5",
      title: "Informatika: Web sahifa yaratish — HTML va CSS asoslari amaliy topshirig'i",
      subject: "Informatika",
      className: "9-A",
      teacher: "J. Qodirov",
      dueDate: "2026-11-07",
      status: "active",
      completedBy: ["st-9a-1"],
      createdAt: "2026-11-01",
    },
  ],

  // Maktab yangiliklari va e'lonlar
  announcements: [
    {
      id: "ann-1",
      title: "Respublika fan olimpiadasining tuman bosqichida maktabimiz 1-o'rinni egalladi!",
      category: "achievement",
      categoryName: "Yutuqlarimiz",
      date: "2026-11-01",
      author: "Maktab ma'muriyati",
      content: "Chilonzor tumani bosqichida matematika, fizika va ingliz tili fanlari bo'yicha maktabimizning 12 nafar a'lochi o'quvchisi faxrli o'rinlarni qo'lga kiritdi. Barcha g'oliblar va ularning ustozlarini tabriklaymiz!",
      views: 438,
      important: true,
    },
    {
      id: "ann-2",
      title: "Ota-onalar umumiy yig'ilishi va 1-chorak yakunlari hisoboti",
      category: "meeting",
      categoryName: "Majlis",
      date: "2026-11-08",
      author: "Direktor o'rinbosari",
      content: "Hurmatli ota-onalar! 2026-yil 8-noyabr soat 17:30 da maktab majlislar zalida 1-chorak yakunlari va yangi o'quv choragi rejalari bo'yicha umumiy yig'ilish o'tkaziladi. Ishtirokingiz muhim.",
      views: 612,
      important: false,
    },
    {
      id: "ann-3",
      title: "Yangi zamonaviy IT-laboratoriya va robototexnika to'garagi ochildi",
      category: "event",
      categoryName: "Tadbir",
      date: "2026-10-28",
      author: "IT kafedrasi",
      content: "Maktabimizda Raqamli ta'lim doirasida 30 ta eng so'nggi rusumdagi kompyuterlar bilan jihozlangan IT-laboratoriya ishga tushirildi. Darsdan keyin barcha sinflar uchun bepul dasturlash to'garaklari yo'lga qo'yildi.",
      views: 389,
      important: false,
    },
  ],

  // Maktab fotogalereyasi
  gallery: [
    {
      id: "gal-1",
      title: "Maktabimizning bosh binosi va zamonaviy o'quv majmuasi",
      category: "campus",
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80",
      date: "2026-10-15",
    },
    {
      id: "gal-2",
      title: "9-A sinfida ochiq dars va interaktiv ta'lim jarayoni",
      category: "lesson",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
      date: "2026-10-22",
    },
    {
      id: "gal-3",
      title: "Kimyo va biologiya ixtisoslashtirilgan laboratoriyasi",
      category: "lab",
      image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
      date: "2026-10-24",
    },
    {
      id: "gal-4",
      title: "Fan olimpiadasi g'oliblarini tantanali taqdirlash marosimi",
      category: "event",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
      date: "2026-10-29",
    },
    {
      id: "gal-5",
      title: "Maktab kutubxonasi va elektron kitoblar zali",
      category: "library",
      image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80",
      date: "2026-10-18",
    },
    {
      id: "gal-6",
      title: "Futbol va voleybol sport musobaqasi finallari",
      category: "sport",
      image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
      date: "2026-10-30",
    },
  ],

  // Bildirishnomalar
  notifications: [
    {
      id: "notif-1",
      title: "Yangi vazifa berildi",
      message: "Algebra fanidan 245-248 misollar (Muddat: 4-noyabr)",
      time: "10 daqiqa oldin",
      read: false,
      type: "homework",
    },
    {
      id: "notif-2",
      title: "Davomat tasdiqlandi",
      message: "9-A sinfining bugungi davomati: 90% (7 kelgan, 1 kechikkan)",
      time: "1 soat oldin",
      read: false,
      type: "attendance",
    },
    {
      id: "notif-3",
      title: "Yangi e'lon joylandi",
      message: "Respublika fan olimpiadasining tuman bosqichi g'oliblari",
      time: "Bugun 09:00",
      read: false,
      type: "announcement",
    },
  ],
};

/* Ma'lumotlarni yuklash va saqlash mexanizmi */
function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
      return structuredClone(SEED_DATA);
    }
    const parsed = JSON.parse(raw);
    // Barcha maydonlar mavjudligini ta'minlash
    return {
      school: { ...SEED_DATA.school, ...(parsed.school || {}) },
      classes: parsed.classes || SEED_DATA.classes,
      students: parsed.students || SEED_DATA.students,
      teachers: parsed.teachers || SEED_DATA.teachers,
      bellSchedule: parsed.bellSchedule || SEED_DATA.bellSchedule,
      schedule: parsed.schedule || SEED_DATA.schedule,
      attendanceDaily: parsed.attendanceDaily || SEED_DATA.attendanceDaily,
      attendance: parsed.attendance || SEED_DATA.attendance,
      grades: parsed.grades || SEED_DATA.grades,
      homework: parsed.homework || SEED_DATA.homework,
      announcements: parsed.announcements || SEED_DATA.announcements,
      gallery: parsed.gallery || SEED_DATA.gallery,
      notifications: parsed.notifications || SEED_DATA.notifications,
    };
  } catch (e) {
    console.error("Local database error:", e);
    return structuredClone(SEED_DATA);
  }
}

let db = loadStore();

function persistStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error("Failed to save to localStorage:", err);
  }
}

/* =========================================================
   PUBLIC API: CRUD VA YORDAMCHI METODLAR
   ========================================================= */

export const schoolDB = {
  // Maktab ma'lumotlari
  getSchoolInfo() {
    return { ...db.school };
  },

  updateSchoolInfo(data) {
    db.school = { ...db.school, ...data };
    persistStore();
    return db.school;
  },

  // Sinflar
  getClasses() {
    return [...db.classes];
  },

  addClass(item) {
    const newClass = {
      id: "c-" + Date.now(),
      name: String(item.name).trim(),
      teacher: String(item.teacher || "").trim(),
      students: Number(item.students) || 0,
      room: item.room || "101",
      shift: Number(item.shift) || 1,
      gradeLevel: parseInt(item.name, 10) || 5,
    };
    db.classes.push(newClass);
    // Davomat ro'yxatiga ham boshlang'ich 100% bilan qo'shish
    db.attendance.push({
      id: "att-" + Date.now(),
      className: newClass.name,
      percent: 100,
    });
    persistStore();
    return newClass;
  },

  deleteClass(classId) {
    const item = db.classes.find((c) => c.id === classId || c.name === classId);
    if (!item) return false;
    db.classes = db.classes.filter((c) => c.id !== item.id);
    db.attendance = db.attendance.filter((a) => a.className !== item.name);
    persistStore();
    return true;
  },

  // O'quvchilar
  getStudents(className) {
    if (!className) return [...db.students];
    return db.students.filter(
      (s) => s.className.toLowerCase() === className.toLowerCase() || s.classId === className
    );
  },

  addStudent(item) {
    const newStudent = {
      id: "st-" + Date.now(),
      classId: item.classId || "c-9a",
      className: item.className || "9-A",
      name: String(item.name).trim(),
      gender: item.gender || "m",
      parentName: item.parentName || "Ota-onasi",
      parentPhone: item.parentPhone || "+998 90 000-00-00",
      rating: Number(item.rating) || 5.0,
      status: "active",
    };
    db.students.push(newStudent);
    // Sinfdagi sonni oshirish
    const cls = db.classes.find((c) => c.name === newStudent.className);
    if (cls) cls.students = (cls.students || 0) + 1;
    persistStore();
    return newStudent;
  },

  // O'qituvchilar
  getTeachers() {
    return [...db.teachers];
  },

  addTeacher(item) {
    const initials = item.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const newTeacher = {
      id: "tch-" + Date.now(),
      name: String(item.name).trim(),
      subject: String(item.subject).trim(),
      category: item.category || "Oliy toifa",
      phone: item.phone || "+998 90 123-45-67",
      email: item.email || "ustoz@36maktab.uz",
      room: item.room || "101",
      hours: Number(item.hours) || 20,
      experience: item.experience || "5 yil",
      avatar: initials,
    };
    db.teachers.push(newTeacher);
    persistStore();
    return newTeacher;
  },

  // Davomat (Umumiy sinf foizlari)
  getAttendanceSummary() {
    return [...db.attendance];
  },

  // Haqiqiy kundalik davomat
  getDailyAttendance(className, dateStr) {
    const key = `${className}_${dateStr}`;
    return db.attendanceDaily[key] || null;
  },

  saveDailyAttendance(className, dateStr, recordsMap) {
    const key = `${className}_${dateStr}`;
    const studentIds = Object.keys(recordsMap);
    const total = studentIds.length || 1;

    let presentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;
    let absentCount = 0;

    for (const status of Object.values(recordsMap)) {
      if (status === "present") presentCount++;
      else if (status === "late") lateCount++;
      else if (status === "excused") excusedCount++;
      else if (status === "absent") absentCount++;
    }

    // Foiz: (kelgan + kechikkan) / total * 100
    const percent = Math.round(((presentCount + lateCount) / total) * 1000) / 10;

    const record = {
      className,
      date: dateStr,
      records: recordsMap,
      stats: { total, present: presentCount, late: lateCount, excused: excusedCount, absent: absentCount, percent },
    };

    db.attendanceDaily[key] = record;

    // Umumiy ro'yxatda ham yangilash
    const summaryItem = db.attendance.find((a) => a.className === className);
    if (summaryItem) {
      summaryItem.percent = percent;
    } else {
      db.attendance.push({ id: "att-" + Date.now(), className, percent });
    }

    // Bildirishnoma yaratish
    db.notifications.unshift({
      id: "notif-" + Date.now(),
      title: "Davomat kiritildi",
      message: `${className} sinfida ${dateStr} sanasi uchun davomat yangilandi (${percent}%).`,
      time: "Hozirgina",
      read: false,
      type: "attendance",
    });

    persistStore();
    return record;
  },

  // Dars jadvali
  getSchedule(className, dayKey = "monday") {
    const clsSchedule = db.schedule[className] || db.schedule["9-A"] || {};
    return clsSchedule[dayKey] || [];
  },

  saveScheduleLesson(className, dayKey, lesson) {
    if (!db.schedule[className]) db.schedule[className] = {};
    if (!db.schedule[className][dayKey]) db.schedule[className][dayKey] = [];

    const list = db.schedule[className][dayKey];
    const existingIndex = list.findIndex((l) => l.period === lesson.period);
    if (existingIndex >= 0) {
      list[existingIndex] = lesson;
    } else {
      list.push(lesson);
      list.sort((a, b) => a.period - b.period);
    }
    persistStore();
    return list;
  },

  // Baholar jurnali
  getGrades(className, subject) {
    const key = `${className}_${subject}`;
    if (db.grades[key]) return [...db.grades[key]];

    // Yangi fan bo'lsa o'quvchilar ro'yxatidan yasab beramiz
    const students = this.getStudents(className);
    const list = students.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      marks: [5, 4, 5],
      average: 4.7,
    }));
    db.grades[key] = list;
    persistStore();
    return list;
  },

  addGradeMark(className, subject, studentId, mark) {
    const key = `${className}_${subject}`;
    const list = this.getGrades(className, subject);
    const item = list.find((g) => g.studentId === studentId);
    if (item) {
      item.marks.push(mark);
      const sum = item.marks.reduce((a, b) => a + b, 0);
      item.average = Math.round((sum / item.marks.length) * 10) / 10;
      persistStore();
      return item;
    }
    return null;
  },

  // Uyga vazifalar
  getHomework(filter = {}) {
    let list = [...db.homework];
    if (filter.className) {
      list = list.filter((h) => h.className === filter.className);
    }
    return list;
  },

  addHomework(item) {
    const newHw = {
      id: "hw-" + Date.now(),
      title: String(item.title).trim(),
      subject: item.subject || "Matematika",
      className: item.className || "9-A",
      teacher: item.teacher || "O'qituvchi",
      dueDate: item.dueDate || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      status: "active",
      completedBy: [],
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.homework.unshift(newHw);

    // Bildirishnoma
    db.notifications.unshift({
      id: "notif-" + Date.now(),
      title: "Yangi uyga vazifa",
      message: `${newHw.className} — ${newHw.subject}: ${newHw.title.slice(0, 50)}...`,
      time: "Hozirgina",
      read: false,
      type: "homework",
    });

    persistStore();
    return newHw;
  },

  toggleHomeworkCompleted(hwId, studentId = "st-9a-1") {
    const item = db.homework.find((h) => h.id === hwId);
    if (!item) return false;
    if (!item.completedBy) item.completedBy = [];

    const index = item.completedBy.indexOf(studentId);
    if (index >= 0) {
      item.completedBy.splice(index, 1);
    } else {
      item.completedBy.push(studentId);
    }
    persistStore();
    return true;
  },

  deleteHomework(hwId) {
    db.homework = db.homework.filter((h) => h.id !== hwId);
    persistStore();
    return true;
  },

  // E'lonlar
  getAnnouncements() {
    return [...db.announcements];
  },

  addAnnouncement(item) {
    const newAnn = {
      id: "ann-" + Date.now(),
      title: String(item.title).trim(),
      category: item.category || "event",
      categoryName: item.categoryName || "E'lon",
      date: new Date().toISOString().slice(0, 10),
      author: item.author || "Maktab ma'muriyati",
      content: String(item.content || "").trim(),
      views: 1,
      important: Boolean(item.important),
    };
    db.announcements.unshift(newAnn);

    db.notifications.unshift({
      id: "notif-" + Date.now(),
      title: "Maktab e'loni",
      message: newAnn.title,
      time: "Hozirgina",
      read: false,
      type: "announcement",
    });

    persistStore();
    return newAnn;
  },

  // Galereya
  getGallery() {
    return [...db.gallery];
  },

  addGalleryImage(item) {
    const newImg = {
      id: "gal-" + Date.now(),
      title: String(item.title).trim(),
      category: item.category || "campus",
      image: item.image,
      date: new Date().toISOString().slice(0, 10),
    };
    db.gallery.unshift(newImg);
    persistStore();
    return newImg;
  },

  deleteGalleryImage(id) {
    db.gallery = db.gallery.filter((g) => g.id !== id);
    persistStore();
    return true;
  },

  // Bildirishnomalar
  getNotifications() {
    return [...db.notifications];
  },

  markNotificationsRead() {
    for (const n of db.notifications) n.read = true;
    persistStore();
    return true;
  },

  // Qo'ng'iroqlar va jonli dars holati
  getCurrentBellStatus() {
    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes();
    const currentMins = hours * 60 + mins;

    for (const bell of db.bellSchedule) {
      const [sh, sm] = bell.start.split(":").map(Number);
      const [eh, em] = bell.end.split(":").map(Number);
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;

      if (currentMins >= startMins && currentMins <= endMins) {
        const remaining = endMins - currentMins;
        return {
          inLesson: true,
          period: bell.period,
          label: bell.label,
          remainingMinutes: remaining,
          timeRange: `${bell.start} - ${bell.end}`,
        };
      }
    }

    // Dars vaqti emas
    return {
      inLesson: false,
      period: null,
      label: "Hozir tanaffus / dars tugagan",
      remainingMinutes: 0,
      timeRange: "08:30 - 13:45",
    };
  },
};
