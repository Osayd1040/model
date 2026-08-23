/**
 * منصة الموديلز - Main Application Logic & Supabase Integration
 */

// Global State
let currentUser = JSON.parse(localStorage.getItem('models_app_user')) || null;
let localModels = JSON.parse(localStorage.getItem('models_app_demo_models')) || DEMO_MODELS;
let localPortfolio = JSON.parse(localStorage.getItem('models_app_demo_portfolio')) || DEMO_PORTFOLIO;

// Save local fallback state
function persistLocalState() {
  localStorage.setItem('models_app_demo_models', JSON.stringify(localModels));
  localStorage.setItem('models_app_demo_portfolio', JSON.stringify(localPortfolio));
}

/* ==========================================================================
   Toast Notification Helper
   ========================================================================== */
function translateSupabaseError(errorMsg) {
  if (!errorMsg) return "حصلت مشكلة غير متوقعة، معلش جرب تاني.";
  const msg = String(errorMsg).toLowerCase();

  if (msg.includes("email not confirmed")) {
    return "ياريت تفعل حسابك من اللينك اللي بعتناهولك على الإيميل.";
  }
  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
    return "الإيميل أو الباسوورد غلط، راجعهم تاني.";
  }
  if (msg.includes("user already registered") || msg.includes("already registered") || msg.includes("user_already_exists")) {
    return "حسابك متسجل قبل كده، ياريت تعمل تسجيل دخول.";
  }
  if (msg.includes("password should be at least 6 characters") || msg.includes("at least 6 characters")) {
    return "الباسوورد لازم يكون 6 خانات على الأقل عشان الأمان.";
  }

  return "حصلت مشكلة غير متوقعة، معلش جرب تاني. التفاصيل: " + String(errorMsg);
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let iconClass = 'fa-solid fa-circle-info';
  if (type === 'success') iconClass = 'fa-solid fa-circle-check';
  if (type === 'error') iconClass = 'fa-solid fa-circle-exclamation';

  toast.innerHTML = `
    <i class="${iconClass}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ==========================================================================
   Supabase / Data Service Layer
   ========================================================================== */
async function fetchAllModels() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('role', 'model');
      if (error) throw error;
      if (data && data.length > 0) return data;
    } catch (err) {
      console.error("Error fetching models from Supabase:", err);
    }
  }
  return localModels;
}

async function fetchModelById(id) {
  if (supabaseClient) {
    try {
      const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;

      const { data: details } = await supabaseClient
        .from('model_details')
        .select('*')
        .eq('profile_id', id)
        .maybeSingle();

      if (profile) {
        return {
          ...profile,
          height: details?.height || profile.height || '',
          weight: details?.weight || profile.weight || '',
          bio: details?.bio || profile.bio || '',
          whatsapp_number: details?.whatsapp || profile.whatsapp_number || '',
          instagram_url: details?.instagram || profile.instagram_url || '',
          tiktok_url: details?.tiktok || profile.tiktok_url || ''
        };
      }
    } catch (err) {
      console.error("Error fetching model profile from Supabase:", err);
    }
  }
  return localModels.find(m => m.id === id) || localModels[0];
}

async function fetchPortfolioImages(modelId) {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('portfolio_images')
        .select('*')
        .eq('model_id', modelId);
      if (error) throw error;
      if (data) return data;
    } catch (err) {
      console.error("Error fetching portfolio from Supabase:", err);
    }
  }
  return localPortfolio[modelId] || [];
}

async function updateModelProfile(id, profileData) {
  if (supabaseClient) {
    try {
      console.log("Saving profile to Supabase...", { id, profileData });

      const profilePayload = {
        id: id,
        full_name: profileData.full_name,
        city: profileData.city,
        category: profileData.category,
        avatar_url: profileData.avatar_url,
        role: 'model'
      };

      const parsedHeight = parseInt(profileData.height, 10);
      const parsedWeight = parseInt(profileData.weight, 10);

      const detailsPayload = {
        profile_id: id,
        height: isNaN(parsedHeight) ? null : parsedHeight,
        weight: isNaN(parsedWeight) ? null : parsedWeight,
        bio: profileData.bio,
        whatsapp: profileData.whatsapp_number,
        instagram: profileData.instagram_url,
        tiktok: profileData.tiktok_url
      };

      const { error: profileErr } = await supabaseClient
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      const { error: detailsErr } = await supabaseClient
        .from('model_details')
        .upsert(detailsPayload, { onConflict: 'profile_id' });

      if (profileErr || detailsErr) {
        const err = profileErr || detailsErr;
        console.error("Supabase Upsert Error:", err);
        showToast("حصلت مشكلة وإحنا بنحفظ: " + translateSupabaseError(err.message), "error");
        return false;
      }

      console.log("Successfully saved profile and details to Supabase!");
      return true;
    } catch (err) {
      console.error("Exception updating profile in Supabase:", err);
      showToast("حصلت مشكلة غير متوقعة وإحنا بنحفظ البيانات.", "error");
      return false;
    }
  }

  // Fallback update local state
  const index = localModels.findIndex(m => m.id === id);
  if (index !== -1) {
    localModels[index] = { ...localModels[index], ...profileData };
    persistLocalState();
    return true;
  }
  return false;
}

async function uploadAvatarFile(modelId, file) {
  if (!file) return null;

  if (supabaseClient) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${modelId}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${modelId}/${fileName}`;

      showToast("بنرفع صورتك...", "info");

      const { error: uploadError } = await supabaseClient
        .storage
        .from('portfolio')
        .upload(filePath, file);

      if (uploadError) {
        showToast("حصلت مشكلة وإحنا بنرفع الصورة: " + translateSupabaseError(uploadError.message), "error");
        return null;
      }

      const { data: publicUrlData } = supabaseClient
        .storage
        .from('portfolio')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error("Avatar upload error:", err);
      showToast("حصلت مشكلة وإحنا بنرفع الصورة.", "error");
      return null;
    }
  }

  // Fallback Data URL reader for local file upload preview
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

async function uploadPortfolioPhoto(modelId, file) {
  if (!file) return false;

  let finalImageUrl = null;

  if (supabaseClient) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `portfolio_${modelId}_${Date.now()}.${fileExt}`;
      const filePath = `photos/${fileName}`;

      showToast("بنرفع الصورة لمعرض الأعمال...", "info");

      // Upload file to 'portfolio' bucket
      const { error: uploadError } = await supabaseClient
        .storage
        .from('portfolio')
        .upload(filePath, file);

      if (uploadError) {
        showToast("حصلت مشكلة وإحنا بنرفع الصورة: " + translateSupabaseError(uploadError.message), "error");
        return false;
      }

      // Get public URL
      const { data: publicUrlData } = supabaseClient
        .storage
        .from('portfolio')
        .getPublicUrl(filePath);

      finalImageUrl = publicUrlData.publicUrl;
    } catch (err) {
      console.error("Storage upload error:", err);
      showToast("حصلت مشكلة وإحنا بنرفع الصورة.", "error");
      return false;
    }
  } else {
    // Local device file upload reader for fallback demo mode
    finalImageUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  // Insert database record
  if (supabaseClient && finalImageUrl) {
    try {
      const { data, error } = await supabaseClient
        .from('portfolio_images')
        .insert([{ model_id: modelId, image_url: finalImageUrl }]);

      if (error) {
        showToast("حصلت مشكلة وإحنا بنحفظ الصورة في الداتا: " + translateSupabaseError(error.message), "error");
        return false;
      }
      return true;
    } catch (err) {
      console.error("DB insert image error:", err);
      showToast("حصلت مشكلة غير متوقعة وإحنا بنحفظ الصورة.", "error");
      return false;
    }
  }

  // Fallback storage
  if (finalImageUrl) {
    if (!localPortfolio[modelId]) localPortfolio[modelId] = [];
    localPortfolio[modelId].unshift({
      id: "p-loc-" + Date.now(),
      model_id: modelId,
      image_url: finalImageUrl
    });
    persistLocalState();
    return true;
  }

  return false;
}

async function deletePortfolioPhoto(imageId, modelId) {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('portfolio_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        showToast("حصلت مشكلة وإحنا بنمسح الصورة: " + translateSupabaseError(error.message), "error");
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error deleting image from Supabase:", err);
      showToast("حصلت مشكلة غير متوقعة وإحنا بنمسح الصورة.", "error");
      return false;
    }
  }

  // Fallback deletion
  if (localPortfolio[modelId]) {
    localPortfolio[modelId] = localPortfolio[modelId].filter(img => img.id !== imageId);
    persistLocalState();
    return true;
  }
  return false;
}

/* ==========================================================================
   Auth Modal & Session Handlers
   ========================================================================== */
function initAuthModal() {
  const modal = document.getElementById('authModal');
  const navAuthBtn = document.getElementById('navAuthBtn');
  const heroModelBtn = document.getElementById('heroModelBtn');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (!modal) return;

  // Update Nav Button based on session state
  if (currentUser && navAuthBtn) {
    navAuthBtn.innerHTML = `
      <i class="fa-solid fa-gauge-high"></i>
      <span>لوحة التحكم</span>
    `;
    navAuthBtn.onclick = () => window.location.href = 'dashboard.html';
  } else if (navAuthBtn) {
    navAuthBtn.onclick = () => openModal();
  }

  if (heroModelBtn) {
    heroModelBtn.onclick = () => {
      if (currentUser) {
        window.location.href = 'dashboard.html';
      } else {
        openModal(true); // default register tab
      }
    };
  }

  function openModal(isRegister = false) {
    modal.classList.add('active');
    if (isRegister) {
      tabRegister.click();
    } else {
      tabLogin.click();
    }
  }

  if (modalCloseBtn) {
    modalCloseBtn.onclick = () => modal.classList.remove('active');
  }

  // Close on outside overlay click
  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.remove('active');
  };

  // Tab Switching
  if (tabLogin && tabRegister) {
    tabLogin.onclick = () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
    };

    tabRegister.onclick = () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      registerForm.style.display = 'block';
      loginForm.style.display = 'none';
    };
  }

  // Handle Login Submit
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('loginEmail') || document.getElementById('loginPhone');
      const email = emailInput ? emailInput.value.trim() : '';
      const password = document.getElementById('loginPassword').value;

      // Handle email or phone fallback for Supabase auth
      const authEmail = email.includes('@') ? email : `${email.replace(/\D/g, '')}@models.local`;

      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.auth.signInWithPassword({ email: authEmail, password });
          if (error) {
            showToast(translateSupabaseError(error.message), "error");
            return;
          }
          const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', data.user.id).single();
          currentUser = profile || { id: data.user.id, full_name: email, email: email, role: 'model' };
        } catch (err) {
          showToast("حصلت مشكلة غير متوقعة، معلش جرب تاني.", "error");
          return;
        }
      } else {
        // Mock Login: pick existing model or create demo user
        const found = localModels.find(m => (m.email && m.email.toLowerCase() === email.toLowerCase()) || (m.whatsapp_number && email && m.whatsapp_number.includes(email.replace(/\D/g, '')))) || localModels[0];
        currentUser = found;
      }

      localStorage.setItem('models_app_user', JSON.stringify(currentUser));
      showToast(`يا هلا بيك يا غالي ${currentUser.full_name}! منورنا.`, "success");
      modal.classList.remove('active');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);
    };
  }

  // Handle Register Submit
  if (registerForm) {
    registerForm.onsubmit = async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('regFullName').value;
      const emailInput = document.getElementById('regEmail') || document.getElementById('regPhone');
      const email = emailInput ? emailInput.value.trim() : '';
      const password = document.getElementById('regPassword').value;
      
      const categorySelect = document.getElementById('regCategory');
      const category = categorySelect ? categorySelect.value : 'عروض أزياء';

      const authEmail = email.includes('@') ? email : `${email.replace(/\D/g, '')}@models.local`;

      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.auth.signUp({ email: authEmail, password });
          if (error) {
            showToast(translateSupabaseError(error.message), "error");
            return;
          }
          if (data.user) {
            const newProfile = {
              id: data.user.id,
              role: 'model',
              full_name: fullName,
              email: authEmail,
              category: category,
              city: '',
              avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800'
            };
            const { error: profileError } = await supabaseClient.from('profiles').upsert([newProfile], { onConflict: 'id' });
            if (profileError) {
              console.error("Error creating profile record:", profileError);
            }
            currentUser = newProfile;
          }
        } catch (err) {
          showToast("حصلت مشكلة غير متوقعة، معلش جرب تاني.", "error");
          return;
        }
      } else {
        // Demo Registration
        const newModel = {
          id: "m-new-" + Date.now(),
          full_name: fullName,
          email: authEmail,
          category: category,
          city: "الرياض",
          whatsapp_number: "966500000000",
          instagram_url: "https://instagram.com",
          tiktok_url: "https://tiktok.com",
          height: "175 سم",
          weight: "60 كجم",
          bio: "موديل لسه منضم جديد على المنصة.",
          avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800",
          role: "model"
        };
        localModels.unshift(newModel);
        localPortfolio[newModel.id] = [];
        persistLocalState();
        currentUser = newModel;
      }

      localStorage.setItem('models_app_user', JSON.stringify(currentUser));
      showToast(`عاش يا بطل! عملنالك الحساب بنجاح.`, "success");
      modal.classList.remove('active');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);
    };
  }
}

/* ==========================================================================
   Model Card Component Generator
   ========================================================================== */
function createModelCardHTML(model) {
  const avatar = model.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800';
  const whatsappUrl = `https://wa.me/${model.whatsapp_number}?text=${encodeURIComponent('أهلاً ' + model.full_name + '، كنت حابب اتواصل معاك من منصة الموديلز')}`;

  return `
    <div class="model-card">
      <div class="model-thumb-container">
        <img src="${avatar}" alt="${model.full_name}" class="model-thumb">
        <div class="model-badge-overlay">
          <span class="gold-badge">
            <i class="fa-solid fa-sparkles"></i>
            ${model.category || 'موديل'}
          </span>
        </div>
      </div>
      
      <div class="model-card-body">
        <h3 class="model-card-name">${model.full_name}</h3>
        
        <div class="model-card-info">
          <span><i class="fa-solid fa-location-dot"></i> ${model.city || 'السعودية'}</span>
          <span>•</span>
          <span><i class="fa-solid fa-ruler-vertical"></i> ${model.height || '175 سم'}</span>
        </div>

        <div class="model-card-actions">
          <a href="profile.html?id=${model.id}" class="btn btn-gold btn-square" title="شوف البروفايل">
            <i class="fa-solid fa-user"></i>
          </a>
          
          <a href="${whatsappUrl}" target="_blank" class="btn btn-whatsapp btn-square" title="تواصل على الواتساب">
            <i class="fa-brands fa-whatsapp"></i>
          </a>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   Page Logic: Landing Page (index.html)
   ========================================================================== */
async function initLandingPage() {
  const grid = document.getElementById('featuredModelsGrid');
  if (!grid) return;

  const models = await fetchAllModels();
  const featured = models.slice(0, 3);

  grid.innerHTML = featured.map(createModelCardHTML).join('');
}

/* ==========================================================================
   Page Logic: Explore Directory (explore.html)
   ========================================================================== */
async function initExplorePage() {
  const grid = document.getElementById('exploreModelsGrid');
  if (!grid) return;

  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const cityFilter = document.getElementById('cityFilter');

  const allModels = await fetchAllModels();

  function renderFilteredModels() {
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const selectedCat = categoryFilter ? categoryFilter.value : '';
    const selectedCity = cityFilter ? cityFilter.value : '';

    const filtered = allModels.filter(m => {
      const matchSearch = !searchTerm ||
        m.full_name.toLowerCase().includes(searchTerm) ||
        (m.bio && m.bio.toLowerCase().includes(searchTerm)) ||
        (m.category && m.category.toLowerCase().includes(searchTerm));

      const matchCat = !selectedCat || m.category === selectedCat;
      const matchCity = !selectedCity || m.city === selectedCity;

      return matchSearch && matchCat && matchCity;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-user-slash empty-icon"></i>
          <h3>ملقيناش نتائج بالوصف ده</h3>
          <p>جرب تدور بكلمات تانية، أو غير المدينة والتخصص.</p>
        </div>
      `;
    } else {
      grid.innerHTML = filtered.map(createModelCardHTML).join('');
    }
  }

  if (searchInput) searchInput.oninput = renderFilteredModels;
  if (categoryFilter) categoryFilter.onchange = renderFilteredModels;
  if (cityFilter) cityFilter.onchange = renderFilteredModels;

  renderFilteredModels();
}

/* ==========================================================================
   Page Logic: Instagram-Style Profile Page (profile.html)
   ========================================================================== */
async function initProfilePage() {
  const profileHeader = document.getElementById('profileHeader');
  if (!profileHeader) return;

  const urlParams = new URLSearchParams(window.location.search);
  const modelId = urlParams.get('id') || (currentUser ? currentUser.id : "m-101");

  const model = await fetchModelById(modelId);
  const images = await fetchPortfolioImages(modelId);

  // Bind Header Fields
  document.title = `${model.full_name} | منصة الموديلز`;
  document.getElementById('profileAvatar').src = model.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800';
  document.getElementById('profileName').textContent = model.full_name;
  document.getElementById('profileCategory').textContent = model.category || 'موديل';
  document.getElementById('profileBio').textContent = model.bio || 'لسه مكتبش نبذة عن نفسه.';

  document.getElementById('profileHeight').textContent = model.height || '175 سم';
  document.getElementById('profileWeight').textContent = model.weight || '56 كجم';
  document.getElementById('profileStatCategory').textContent = model.category || 'عرض أزياء';
  document.getElementById('profileCity').textContent = model.city || 'الرياض';

  // Social Links & WhatsApp
  const whatsappBtn = document.getElementById('profileWhatsappBtn');
  if (whatsappBtn) {
    const waNum = model.whatsapp_number ? model.whatsapp_number.replace(/\D/g, '') : '966501234567';
    whatsappBtn.href = `https://wa.me/${waNum}?text=${encodeURIComponent('أهلاً ' + model.full_name + '، كنت حابب اتواصل معاك من منصة الموديلز')}`;
  }

  const instaBtn = document.getElementById('profileInstaBtn');
  if (instaBtn) {
    if (model.instagram_url) {
      instaBtn.href = model.instagram_url;
      instaBtn.style.display = 'inline-flex';
    } else {
      instaBtn.style.display = 'none';
    }
  }

  const tiktokBtn = document.getElementById('profileTiktokBtn');
  if (tiktokBtn) {
    if (model.tiktok_url) {
      tiktokBtn.href = model.tiktok_url;
      tiktokBtn.style.display = 'inline-flex';
    } else {
      tiktokBtn.style.display = 'none';
    }
  }

  // Render Portfolio Gallery
  const portfolioGrid = document.getElementById('portfolioGrid');
  const countBadge = document.getElementById('photoCountBadge');

  if (countBadge) countBadge.textContent = `${images.length} صور`;

  if (images.length === 0) {
    portfolioGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-images empty-icon"></i>
        <h3>لسه مفيش صور في البورتفوليو</h3>
        <p>الموديل لسه ما رفعش أي صور في المعرض.</p>
      </div>
    `;
  } else {
    portfolioGrid.innerHTML = images.map(img => `
      <div class="portfolio-item" onclick="openLightbox('${img.image_url}')">
        <img src="${img.image_url}" alt="Portfolio Image" class="portfolio-img" loading="lazy">
        <div class="portfolio-overlay">
          <i class="fa-solid fa-magnifying-glass-plus"></i>
        </div>
      </div>
    `).join('');
  }
}

// Lightbox Modal Handler
function openLightbox(url) {
  const lightbox = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  if (!lightbox || !lightboxImg) return;

  lightboxImg.src = url;
  lightbox.classList.add('active');

  const closeBtn = document.getElementById('lightboxCloseBtn');
  if (closeBtn) closeBtn.onclick = () => lightbox.classList.remove('active');

  lightbox.onclick = (e) => {
    if (e.target === lightbox) lightbox.classList.remove('active');
  };
}

/* ==========================================================================
   Page Logic: Model Dashboard (dashboard.html)
   ========================================================================== */
async function initDashboardPage() {
  const dashProfileForm = document.getElementById('dashProfileForm');
  if (!dashProfileForm) return;

  // Protect Route
  if (!currentUser) {
    // Pick default model for seamless preview if not logged in
    currentUser = localModels[0];
    localStorage.setItem('models_app_user', JSON.stringify(currentUser));
  }

  if (supabaseClient && currentUser && currentUser.id) {
    try {
      const { data: profileData } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      const { data: detailsData } = await supabaseClient
        .from('model_details')
        .select('*')
        .eq('profile_id', currentUser.id)
        .maybeSingle();

      if (profileData) {
        currentUser = {
          ...currentUser,
          ...profileData,
          height: detailsData?.height || profileData?.height || '',
          weight: detailsData?.weight || profileData?.weight || '',
          bio: detailsData?.bio || profileData?.bio || '',
          whatsapp_number: detailsData?.whatsapp || profileData?.whatsapp_number || '',
          instagram_url: detailsData?.instagram || profileData?.instagram_url || '',
          tiktok_url: detailsData?.tiktok || profileData?.tiktok_url || ''
        };
        localStorage.setItem('models_app_user', JSON.stringify(currentUser));
      }
    } catch (err) {
      console.error("Error loading user profile in dashboard:", err);
    }
  }

  document.getElementById('dashWelcomeName').textContent = currentUser.full_name;
  document.getElementById('dashViewPublicProfile').href = `profile.html?id=${currentUser.id}`;

  // Populate Height Select Dropdown (140 cm to 220 cm)
  const heightSelect = document.getElementById('dashHeight');
  if (heightSelect && heightSelect.options.length <= 1) {
    for (let h = 140; h <= 220; h++) {
      const opt = document.createElement('option');
      opt.value = `${h} سم`;
      opt.textContent = `${h} سم`;
      heightSelect.appendChild(opt);
    }
  }

  // Populate Weight Select Dropdown (40 kg to 150 kg)
  const weightSelect = document.getElementById('dashWeight');
  if (weightSelect && weightSelect.options.length <= 1) {
    for (let w = 40; w <= 150; w++) {
      const opt = document.createElement('option');
      opt.value = `${w} كجم`;
      opt.textContent = `${w} كجم`;
      weightSelect.appendChild(opt);
    }
  }

  // Populate Profile Form Inputs - Use placeholders when value is empty
  document.getElementById('dashFullName').value = currentUser.full_name || '';
  document.getElementById('dashCity').value = currentUser.city || '';
  document.getElementById('dashCategory').value = currentUser.category || '';
  if (heightSelect) heightSelect.value = currentUser.height || '';
  if (weightSelect) weightSelect.value = currentUser.weight || '';
  document.getElementById('dashWhatsapp').value = currentUser.whatsapp_number || '';
  document.getElementById('dashInstagram').value = currentUser.instagram_url || '';
  document.getElementById('dashTiktok').value = currentUser.tiktok_url || '';
  document.getElementById('dashBio').value = currentUser.bio || '';

  const avatarPreview = document.getElementById('dashAvatarPreview');
  const avatarFileInput = document.getElementById('dashAvatarFileInput');
  if (avatarPreview && currentUser.avatar_url) {
    avatarPreview.src = currentUser.avatar_url;
  }

  let selectedAvatarFile = null;
  if (avatarFileInput) {
    avatarFileInput.onchange = (e) => {
      if (e.target.files && e.target.files[0]) {
        selectedAvatarFile = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (avatarPreview) avatarPreview.src = evt.target.result;
        };
        reader.readAsDataURL(selectedAvatarFile);
      }
    };
  }

  // Profile Form Save
  dashProfileForm.onsubmit = async (e) => {
    e.preventDefault();

    let avatarUrl = currentUser.avatar_url;
    if (selectedAvatarFile) {
      const uploadedAvatarUrl = await uploadAvatarFile(currentUser.id, selectedAvatarFile);
      if (uploadedAvatarUrl) {
        avatarUrl = uploadedAvatarUrl;
      }
    }

    const updatedData = {
      full_name: document.getElementById('dashFullName').value,
      city: document.getElementById('dashCity').value,
      category: document.getElementById('dashCategory').value,
      height: document.getElementById('dashHeight').value,
      weight: document.getElementById('dashWeight').value,
      whatsapp_number: document.getElementById('dashWhatsapp').value,
      instagram_url: document.getElementById('dashInstagram').value,
      tiktok_url: document.getElementById('dashTiktok').value,
      avatar_url: avatarUrl,
      bio: document.getElementById('dashBio').value
    };

    const success = await updateModelProfile(currentUser.id, updatedData);
    if (success) {
      currentUser = { ...currentUser, ...updatedData };
      localStorage.setItem('models_app_user', JSON.stringify(currentUser));
      document.getElementById('dashWelcomeName').textContent = currentUser.full_name;
      selectedAvatarFile = null;
      if (avatarFileInput) avatarFileInput.value = '';
      showToast("عاش يا نجم! سيفنا كل بياناتك بنجاح.", "success");
    }
  };

  // Logout Handler
  const logoutBtn = document.getElementById('dashLogoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem('models_app_user');
      if (supabaseClient) supabaseClient.auth.signOut();
      showToast("نشوفك على خير يا غالي", "info");
      setTimeout(() => window.location.href = 'index.html', 500);
    };
  }

  // Handle Photo Upload UI
  const uploadDropzone = document.getElementById('uploadDropzone');
  const fileInput = document.getElementById('portfolioFileInput');
  const fileSelectedInfo = document.getElementById('fileSelectedInfo');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const clearFileBtn = document.getElementById('clearFileBtn');
  const dashUploadForm = document.getElementById('dashUploadForm');
  let selectedFile = null;

  if (uploadDropzone && fileInput) {
    uploadDropzone.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
      if (e.target.files && e.target.files[0]) {
        selectedFile = e.target.files[0];
        fileNameDisplay.textContent = `الصورة اللي اخترتها: ${selectedFile.name}`;
        fileSelectedInfo.style.display = 'flex';
      }
    };

    if (clearFileBtn) {
      clearFileBtn.onclick = () => {
        selectedFile = null;
        fileInput.value = '';
        fileSelectedInfo.style.display = 'none';
      };
    }
  }

  // Upload Form Submit
  if (dashUploadForm) {
    dashUploadForm.onsubmit = async (e) => {
      e.preventDefault();

      if (!selectedFile) {
        showToast("اختار صورة من جهازك الأول", "error");
        return;
      }

      const success = await uploadPortfolioPhoto(currentUser.id, selectedFile);

      if (success) {
        showToast("تسلم إيدك! الصورة اتضافت بنجاح.", "success");
        // Reset Inputs
        selectedFile = null;
        if (fileInput) fileInput.value = '';
        if (fileSelectedInfo) fileSelectedInfo.style.display = 'none';

        // Immediate DOM gallery re-render (No Page Refresh Required!)
        await loadDashboardPortfolio();
      }
    };
  }

  // Load and Render Dashboard Portfolio Preview
  async function loadDashboardPortfolio() {
    const dashGrid = document.getElementById('dashPortfolioGrid');
    const countBadge = document.getElementById('dashPhotoCount');
    if (!dashGrid) return;

    const images = await fetchPortfolioImages(currentUser.id);
    if (countBadge) countBadge.textContent = `${images.length} صور`;

    if (images.length === 0) {
      dashGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 30px 0;">
          <i class="fa-solid fa-cloud-arrow-up" style="font-size: 2rem; color: var(--gold-primary); margin-bottom: 8px;"></i>
          <p>مفيش صور مضافة لسه. ارفع أول صورة ليك!</p>
        </div>
      `;
    } else {
      dashGrid.innerHTML = images.map(img => `
        <div class="dash-photo-item">
          <img src="${img.image_url}" alt="Model Photo" class="dash-photo-img">
          <div class="dash-photo-delete" onclick="handleDeletePhoto('${img.id}')" title="احذف الصورة">
            <i class="fa-solid fa-trash-can"></i>
          </div>
        </div>
      `).join('');
    }
  }

  // Delete Photo Handler
  window.handleDeletePhoto = async (imageId) => {
    if (confirm("متأكد إنك عايز تمسح الصورة دي؟")) {
      const success = await deletePortfolioPhoto(imageId, currentUser.id);
      if (success) {
        showToast("الصورة اتمسحت بنجاح", "success");
        loadDashboardPortfolio();
      }
    }
  };

  loadDashboardPortfolio();
}

/* ==========================================================================
   Application Initialization Router
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initAuthModal();
  initLandingPage();
  initExplorePage();
  initProfilePage();
  initDashboardPage();
});
