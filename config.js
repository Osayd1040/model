/**
 * منصة المودلز - Models Platform Configuration
 * Supabase Configuration & Fallback Demo Engine
 */

const SUPABASE_URL = "https://gdtpgjzmtvuzudydkhgu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkdHBnanptdHZ1enVkeWRraGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTM0OTIsImV4cCI6MjEwMDg2OTQ5Mn0.zwZWq7VJ_It3mHIRYKalUhdUeloBMIKvWhjEFH9OkBE";

// Check if credentials are set
const isSupabaseConfigured = () => {
  return (
    SUPABASE_URL &&
    SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
    SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"
  );
};

// Initialize Supabase Client if configured
let supabaseClient = null;

if (typeof supabase !== 'undefined' && isSupabaseConfigured()) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Supabase successfully connected!");
  } catch (err) {
    console.error("❌ Failed to initialize Supabase client:", err);
  }
} else {
  console.warn("⚠️ Supabase credentials not provided. Running in high-fidelity Demo Mode with mock data.");
}

// Fallback Demo Data for rich instant preview
const DEMO_MODELS = [
  {
    id: "m-101",
    full_name: "سارة العتيبي",
    category: "عروض أزياء",
    city: "الرياض",
    whatsapp_number: "966501234567",
    instagram_url: "https://instagram.com/sara_models",
    tiktok_url: "https://tiktok.com/@sara_models",
    height: "175 سم",
    weight: "56 كجم",
    bio: "عارضة أزياء متخصصة في العباءات والفساتين الفاخرة، خبرة 4 سنوات في الحملات الإعلانية ومهرجانات الموضة بالرياض وجدة.",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800",
    role: "model"
  },
  {
    id: "m-102",
    full_name: "فيصل الشمري",
    category: "إعلانات تجارية",
    city: "جدة",
    whatsapp_number: "966559876543",
    instagram_url: "https://instagram.com/faisal_style",
    tiktok_url: "https://tiktok.com/@faisal_style",
    height: "183 سم",
    weight: "78 كجم",
    bio: "مودل إعلاني وصانع محتوى في مجال الأناقة واللايف ستايل. شاركت في حملات كبرى للعلامات التجارية في الخليج.",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800",
    role: "model"
  },
  {
    id: "m-103",
    full_name: "ريم الزهراني",
    category: "جلسات تصوير",
    city: "الدمام",
    whatsapp_number: "966541122334",
    instagram_url: "https://instagram.com/reem_visuals",
    tiktok_url: "",
    height: "168 سم",
    weight: "52 كجم",
    bio: "وجه إعلاني ومودل مكياج وجلسات تصوير فوتوغرافي، شغوفة بتجسيد الملامح الشرقية الفخمة.",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800",
    role: "model"
  },
  {
    id: "m-104",
    full_name: "خالد الغامدي",
    category: "فيديو كليب",
    city: "الرياض",
    whatsapp_number: "966567788990",
    instagram_url: "https://instagram.com/khalid_vibe",
    tiktok_url: "https://tiktok.com/@khalid_vibe",
    height: "186 سم",
    weight: "80 كجم",
    bio: "مودل وممثل إعلانات وفيديو كليب، لياقة بدنية عالية وحضور مميز أمام الكاميرا.",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800",
    role: "model"
  },
  {
    id: "m-105",
    full_name: "نورا السبيعي",
    category: "عروض أزياء",
    city: "جدة",
    whatsapp_number: "966533445566",
    instagram_url: "https://instagram.com/nora_fashion",
    tiktok_url: "https://tiktok.com/@nora_fashion",
    height: "172 سم",
    weight: "54 كجم",
    bio: "عارضة أزياء متميزة لمجموعات الصيف والشتاء، خبرة عريضة في منصات العرض وتنسيق الإطلالات.",
    avatar_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800",
    role: "model"
  },
  {
    id: "m-106",
    full_name: "عمر الدوسري",
    category: "جلسات تصوير",
    city: "الخبر",
    whatsapp_number: "966589900112",
    instagram_url: "https://instagram.com/omar_dos",
    tiktok_url: "",
    height: "180 سم",
    weight: "74 كجم",
    bio: "مودل تصوير منتجات وساعات وعطور فاخرة. دقة في المواعيد واحترافية بالعمل.",
    avatar_url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=800",
    role: "model"
  }
];

const DEMO_PORTFOLIO = {
  "m-101": [
    { id: "p-1", model_id: "m-101", image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1000" },
    { id: "p-2", model_id: "m-101", image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000" },
    { id: "p-3", model_id: "m-101", image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=1000" },
    { id: "p-4", model_id: "m-101", image_url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=1000" },
    { id: "p-5", model_id: "m-101", image_url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=1000" },
    { id: "p-6", model_id: "m-101", image_url: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=1000" }
  ],
  "m-102": [
    { id: "p-7", model_id: "m-102", image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1000" },
    { id: "p-8", model_id: "m-102", image_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1000" },
    { id: "p-9", model_id: "m-102", image_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=1000" }
  ],
  "m-103": [
    { id: "p-10", model_id: "m-103", image_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1000" },
    { id: "p-11", model_id: "m-103", image_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=1000" },
    { id: "p-12", model_id: "m-103", image_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1000" }
  ],
  "m-104": [
    { id: "p-13", model_id: "m-104", image_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=1000" },
    { id: "p-14", model_id: "m-104", image_url: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=1000" }
  ],
  "m-105": [
    { id: "p-15", model_id: "m-105", image_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1000" },
    { id: "p-16", model_id: "m-105", image_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1000" },
    { id: "p-17", model_id: "m-105", image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1000" }
  ],
  "m-106": [
    { id: "p-18", model_id: "m-106", image_url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=1000" },
    { id: "p-19", model_id: "m-106", image_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1000" }
  ]
};
