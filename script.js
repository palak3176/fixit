document.addEventListener('DOMContentLoaded', () => {
    // STATE
    let allServices = [];
    let compareList = [];
    let currentCategory = 'All';
    let currentMarketplaceCategory = 'All'; // New State for Marketplace
    let map = null;
    let markers = [];

    // API KEY (Provided by user)
    const GEMINI_API_KEY = "AIzaSyDITQMmO5fzL4b2k9Hze4h4WK6y64prruY"; // Enter your API Key here

    // DOM ELEMENTS
    const sortSelect = document.getElementById('sortSelect');
    const grid = document.getElementById('servicesGrid');
    const searchInput = document.getElementById('searchInput');
    const micBtn = document.getElementById('micBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const mapViewBtn = document.getElementById('mapViewBtn');
    const mapContainer = document.getElementById('mapContainer');

    // Comparison Elements
    const comparisonDrawer = document.getElementById('comparisonDrawer');
    const comparisonGrid = document.getElementById('comparisonGrid');
    const comparisonTab = document.getElementById('comparisonTab');
    const compareCount = document.getElementById('compareCount');
    const clearCompareBtn = document.getElementById('clearCompareBtn');

    // Details Modal Elements
    const detailsModal = document.getElementById('detailsModal');
    const closeDetailsBtn = document.getElementById('closeDetailsBtn');

    // --- MARKETPLACE DATA GENERATION (100+ Items) ---
    const MARKETPLACE_ITEMS = [];
    const ITEM_CATEGORIES = {
        'Plumber': ['Heavy Duty Pipe Wrench', 'Teflon Tape (Pack of 10)', 'Drain Snake Tool', 'Plunger', 'PVC Pipe Cutter', 'Pipe Bender', 'Thread Sealant', 'Faucet Key', 'Basin Wrench', 'Hack Saw Frame', 'Pipe Vise', 'Water Pump Pliers'],
        'Electrician': ['Digital Multimeter', 'Wire Stripper & Cutter', 'Insulated Screwdriver Set', 'Voltage Tester Pen', 'Combination Pliers', 'Electrical Tape Bundle', 'Cable Ties (100pc)', 'Soldering Iron Kit', 'Conduit Bender', 'LED Flashlight', 'Circuit Breaker Finder', 'Wire Crimping Tool'],
        'AC Repair': ['Gas Charging Gauge', 'AC Fin Comb', 'Vacuum Pump 1HP', 'Freon Leak Detector', 'Digital Thermometer', 'Manifold Gauge Set', 'Copper Tube Cutter', 'Flaring Tool Kit', 'AC Cleaning Wash Cover', 'Refrigerant Scale', 'Valve Core Remover', 'Swaging Tool'],
        'Home Nurse': ['Classic Stethoscope', 'Digital BP Monitor', 'First Aid Kit (Large)', 'Pulse Oximeter', 'Glucometer Kit', 'Medical Scissors', 'Crepe Bandage Roll', 'Adjustable Walking Stick', 'Infrared Thermometer', 'Hot Water Bag', 'Reusable Ice Pack', 'Wheelchair (Foldable)'],
        'Tiffin Service': ['Insulated Food Carrier', 'Masala Box Set', 'Electric Rice Cooker', 'Roti Maker Machine', 'Vegetable Chopper', 'Airtight Containers (Set)', 'Serving Spoon Set', 'Thermal Delivery Bag', 'Stainless Steel Bottle', 'Cutlery Set', 'Oil Dispenser', 'Kitchen Weighing Scale'],
        'Carpenter': ['Claw Hammer (Steel)', 'Wood Chisel Set', 'Measuring Tape (5m)', 'Hand Saw', 'Wood Glue (500g)', 'Sandpaper Block', 'Spirit Level', 'Carpenter Square', 'Heavy Duty C-Clamp', 'Drill Bit Set (Wood)', 'Utility Knife', 'Wood Plane'],
        'Painters': ['Paint Roller Kit', 'Masking Tape Bundle', 'Paint Tray', 'Paint Brush Set', 'Canvas Drop Cloth', 'Paint Scraper', 'Extension Pole', 'Sanding Sponge', 'Primer Can (1L)', 'Aluminum Ladder (6ft)', 'Putty Knife', 'Paint Mixing Bucket'],
        'Pest Control': ['Pressure Sprayer (5L)', 'Safety Respirator Mask', 'Herbal Pest Repellent', 'Rat Glue Trap', 'Cockroach Gel Bait', 'Fumigation Machine', 'Rubber Safety Gloves', 'Safety Goggles', 'Rodent Bait Station', 'Dusting Bulb', 'Electric Bug Zapper', 'Thermal Fogging Machine'],
        'Home Parlour': ['Hair Dryer Pro', 'Gold Facial Kit', 'Portable Massage Bed', 'Ceramic Hair Straightener', 'Manicure Set', 'Wax Heater Machine', 'Pedicure Tub', 'Face Steamer', 'Hair Cutting Scissors', 'LED Vanity Mirror', 'Curling Iron', 'Hot Stone Spa Set']
    };

    // Generate flat list of items
    Object.keys(ITEM_CATEGORIES).forEach(cat => {
        ITEM_CATEGORIES[cat].forEach((itemName, index) => {
            // Generate keyword for image (First word + category)
            const keyword = itemName.split(' ')[0];
            const cleanCat = cat.split(' ')[0];

            MARKETPLACE_ITEMS.push({
                id: `item-${cat}-${index}`, // Unique ID for click handling
                name: itemName,
                category: cat,
                // Price: 10 to 800
                price: 10 + Math.floor(Math.random() * 791),
                // Rent: 10 to 500
                rentPrice: 10 + Math.floor(Math.random() * 491),
                rating: (3.5 + Math.random() * 1.5).toFixed(1),
                // Using loremflickr for relevant images based on category and tool name
                image: `https://loremflickr.com/320/240/${cleanCat.toLowerCase()},${keyword.toLowerCase()}?random=${index}`
            });
        });
    });

// --- INITIALIZATION ---
    injectAnimatedBackground(); // 1. Background
    // checkLoginStatus();      // 2. Auth Check (Uncomment only if you added the function!)
    if (!window.currentUser) createLoginModal(); // Fallback if auth is off

    fetchServices();            // 3. Data
    createChatModal();          // 4. Chat
    createBookingModal();       // 5. Booking
    createItemModal();          // 6. Marketplace
    injectSettingsUI();         // 7. Settings
    createAiDiagnosisUI();      // 8. Vision AI
    renderHistorySidebar();     // 9. Sidebar

    injectAiHelpButton();       // 10. AI EXPERT FINDER (The Button!)

    // --- ANIMATED BACKGROUND (2036 Theme with Mouse Interaction) ---
    function injectAnimatedBackground() {
        const bg = document.createElement('div');
        bg.id = 'animated-bg';
        bg.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: -1;
            background: #0a0f1c;
            overflow: hidden;
            pointer-events: none;
        `;

        // Style for Orbs, Grid, and Mouse Spotlight
        const style = document.createElement('style');
        style.textContent = `
            .bg-orb {
                position: absolute;
                border-radius: 50%;
                filter: blur(100px);
                opacity: 0.3;
                animation: floatOrb 20s infinite alternate ease-in-out;
            }
            .bg-grid {
                position: absolute;
                inset: 0;
                background-image:
                    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                background-size: 60px 60px;
                mask-image: radial-gradient(circle at center, black 40%, transparent 90%);
            }
            /* Mouse Follower */
            .mouse-spotlight {
                position: absolute;
                width: 600px;
                height: 600px;
                background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0, 0, 0, 0) 70%);
                border-radius: 50%;
                pointer-events: none;
                transform: translate(-50%, -50%);
                mix-blend-mode: screen;
                z-index: 1;
                transition: opacity 0.5s ease;
            }
            @keyframes floatOrb {
                0% { transform: translate(0, 0) scale(1); }
                50% { transform: translate(50px, -50px) scale(1.1); }
                100% { transform: translate(-30px, 30px) scale(0.95); }
            }
        `;
        document.head.appendChild(style);

        // Add Grid
        const gridOverlay = document.createElement('div');
        gridOverlay.className = 'bg-grid';
        bg.appendChild(gridOverlay);

        // Add Mouse Spotlight
        const spotlight = document.createElement('div');
        spotlight.className = 'mouse-spotlight';
        bg.appendChild(spotlight);

        // Add Orbs
        const orbs = [
            { color: '#3b82f6', top: '10%', left: '20%', size: '400px' }, // Blue
            { color: '#a855f7', top: '60%', left: '80%', size: '500px' }, // Purple
            { color: '#10b981', top: '80%', left: '10%', size: '300px' }  // Emerald
        ];

        orbs.forEach((o, i) => {
            const orb = document.createElement('div');
            orb.className = 'bg-orb';
            orb.style.background = o.color;
            orb.style.top = o.top;
            orb.style.left = o.left;
            orb.style.width = o.size;
            orb.style.height = o.size;
            orb.style.animationDelay = `-${i * 5}s`;
            bg.appendChild(orb);
        });

        document.body.appendChild(bg);

        // Mouse Move Event Listener
        document.addEventListener('mousemove', (e) => {
            // Use requestAnimationFrame for smooth performance
            requestAnimationFrame(() => {
                spotlight.style.left = `${e.clientX}px`;
                spotlight.style.top = `${e.clientY}px`;

                // Slight Parallax for Orbs
                const x = (e.clientX / window.innerWidth) * 20;
                const y = (e.clientY / window.innerHeight) * 20;

                document.querySelectorAll('.bg-orb').forEach((orb, index) => {
                    const factor = index + 1;
                    orb.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
                });
            });
        });
    }

    // --- AI VIDEO DIAGNOSIS LOGIC (Gemini Vision) ---
    function createAiDiagnosisUI() {
        // Create Modal HTML
        const modal = document.createElement('div');
        modal.id = 'aiDiagnosisModal';
        modal.className = 'fixed inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-sm hidden animate-fade-up';

        modal.innerHTML = `
            <div class="w-full max-w-md bg-[#0f172a] border border-purple-500/30 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.15)] overflow-hidden relative p-6">
                <button id="closeAiModalBtn" class="absolute top-4 right-4 text-gray-400 hover:text-white"><i data-lucide="x"></i></button>

                <!-- STEP 1: UPLOAD -->
                <div id="aiStep1" class="text-center">
                    <div class="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <i data-lucide="scan-eye" class="text-purple-400 w-8 h-8"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white mb-2 font-grotesk">AI Video Diagnosis</h2>
                    <p class="text-gray-400 text-sm mb-6">Upload a short video of the issue. Our AI will analyze the visuals to detect the problem and suggest experts.</p>

                    <div class="border-2 border-dashed border-white/10 rounded-xl p-8 hover:border-purple-500 hover:bg-white/5 transition-all cursor-pointer group" onclick="document.getElementById('aiVideoInput').click()">
                        <i data-lucide="video" class="w-10 h-10 text-gray-500 mx-auto mb-2 group-hover:text-purple-400 transition-colors"></i>
                        <span class="text-sm text-gray-300 font-medium">Tap to Record / Upload Video</span>
                        <input type="file" id="aiVideoInput" class="hidden" accept="video/*">
                    </div>
                </div>

                <!-- STEP 2: ANALYZING -->
                <div id="aiStep2" class="hidden text-center py-8">
                    <div class="relative w-24 h-24 mx-auto mb-6">
                        <div class="absolute inset-0 border-4 border-purple-500/20 rounded-full animate-ping"></div>
                        <div class="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin"></div>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <i data-lucide="brain-circuit" class="text-purple-400 w-8 h-8"></i>
                        </div>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">Analyzing Frames...</h3>
                    <p class="text-purple-300/70 text-xs font-mono animate-pulse" id="aiStatusText">Identifying components...</p>
                </div>

                <!-- STEP 3: RESULT -->
                <div id="aiStep3" class="hidden text-left">
                    <div class="flex items-center gap-3 mb-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4 rounded-xl border border-white/10">
                        <div class="bg-green-500/20 p-2 rounded-full text-green-400"><i data-lucide="check-circle" class="w-6 h-6"></i></div>
                        <div>
                            <h3 class="font-bold text-white text-lg">Issue Detected</h3>
                            <p class="text-xs text-gray-400">Confidence: 98%</p>
                        </div>
                    </div>

                    <div class="space-y-4 mb-6">
                        <div>
                            <span class="text-gray-500 text-xs uppercase font-bold">Problem</span>
                            <p class="text-white font-medium text-lg" id="aiResultIssue">Leaking Pipe Joint</p>
                        </div>
                        <div>
                            <span class="text-gray-500 text-xs uppercase font-bold">Recommended Category</span>
                            <div class="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-bold border border-blue-500/30 mt-1" id="aiResultCategory">Plumber</div>
                        </div>
                        <div>
                            <span class="text-gray-500 text-xs uppercase font-bold">Est. Cost</span>
                            <p class="text-emerald-400 font-mono font-bold text-xl" id="aiResultPrice">₹350 - ₹500</p>
                        </div>
                    </div>

                    <button id="aiFindExpertsBtn" class="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2">
                        Find Plumbers Nearby <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Attach Listener to the existing Diagnose Button in Navbar
        const diagnoseBtn = document.getElementById('diagnoseBtn');
        if (diagnoseBtn) {
            diagnoseBtn.onclick = () => {
                modal.classList.remove('hidden');
                document.getElementById('aiStep1').classList.remove('hidden');
                document.getElementById('aiStep2').classList.add('hidden');
                document.getElementById('aiStep3').classList.add('hidden');
                // Reset file input
                document.getElementById('aiVideoInput').value = '';
            };
        }

        // Close Logic
        document.getElementById('closeAiModalBtn').onclick = () => modal.classList.add('hidden');

        // Video Input Logic (The Magic)
        const videoInput = document.getElementById('aiVideoInput');
        videoInput.onchange = async (e) => {
            if (e.target.files && e.target.files[0]) {
                // Show analyzing state
                document.getElementById('aiStep1').classList.add('hidden');
                document.getElementById('aiStep2').classList.remove('hidden');

                // --- SIMULATE GEMINI VISION API ---
                const statusText = document.getElementById('aiStatusText');
                const steps = ["Extracting key frames...", "Scanning visual patterns...", "Detecting water leakage...", "Matching service category..."];
                let stepIdx = 0;

                const interval = setInterval(() => {
                    if(stepIdx < steps.length) {
                        statusText.textContent = steps[stepIdx++];
                    }
                }, 800);

                // Simulate API delay (3.5 seconds)
                setTimeout(() => {
                    clearInterval(interval);

                    // --- SHOW RESULT (MOCKED FOR "Leaking Pipe" -> "Plumber") ---
                    document.getElementById('aiResultIssue').textContent = "Leaking Pipe / Plumbing Failure";
                    document.getElementById('aiResultCategory').textContent = "Plumber";
                    document.getElementById('aiResultPrice').textContent = "₹350 - ₹600";

                    document.getElementById('aiStep2').classList.add('hidden');
                    document.getElementById('aiStep3').classList.remove('hidden');

                    // --- WIRE UP BUTTON TO FILTER ---
                    const findExpertsBtn = document.getElementById('aiFindExpertsBtn');
                    findExpertsBtn.onclick = () => {
                        modal.classList.add('hidden');

                        // Trigger "Plumber" Filter
                        const plumberBtn = Array.from(document.querySelectorAll('.filter-btn')).find(b => b.textContent.trim() === "Plumber");

                        if (plumberBtn) {
                            // Visual feedback
                            plumberBtn.click();
                            plumberBtn.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                        } else {
                            // Fallback manual filter if button not found
                            currentCategory = "Plumber";
                            // Reset button styles manually if needed
                             document.querySelectorAll('.filter-btn').forEach(b => {
                                b.className = 'filter-btn whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border flex items-center gap-2 bg-transparent text-gray-400 border-white/10 hover:border-purple-400/50 hover:text-white hover:bg-purple-500/10 hover:scale-105 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]';
                            });
                            // Can't easily highlight specific button without reference, but functionality works:
                            filterServices();
                        }

                        // Show a toast or small alert (optional)
                        alert("Filtered for Plumbers based on your video diagnosis.");
                    };

                }, 3500);
            }
        };

        if(window.lucide) lucide.createIcons();
    }

    // --- LOGIN & REGISTRATION LOGIC ---
    function createLoginModal() {
        // 1. Create the Modal Wrapper
        const loginModal = document.createElement('div');
        loginModal.id = 'loginModal';
        loginModal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0f1c]';

        // 2. Define the HTML Content
        loginModal.innerHTML = `
            <div id="roleSelection" class="text-center space-y-8 animate-fade-up max-w-2xl px-4">
                <div class="mb-8">
                    <div class="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mx-auto mb-4 animate-bounce">
                        <i data-lucide="zap" class="text-white fill-current w-8 h-8"></i>
                    </div>
                    <h1 class="text-4xl font-bold font-grotesk text-white mb-2 tracking-tight">Welcome to FixIt<span class="text-purple-400">.ai</span></h1>
                    <p class="text-gray-400"></p>
                </div>

                <h2 class="text-2xl font-bold text-white">Who are you?</h2>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <button id="customerBtn" class="group relative p-6 bg-[#131b2e]/80 border border-white/10 rounded-2xl hover:border-blue-500/50 hover:bg-[#1a233b] transition-all duration-300 text-left hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                        <div class="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
                        <div class="bg-blue-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <i data-lucide="search" class="text-blue-400 w-6 h-6"></i>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-2">I need a Service</h3>
                        <p class="text-sm text-gray-400">Find plumbers, electricians, and more near you.</p>
                    </button>

                    <button id="providerBtn" class="group relative p-6 bg-[#131b2e]/80 border border-white/10 rounded-2xl hover:border-purple-500/50 hover:bg-[#1a233b] transition-all duration-300 text-left hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                        <div class="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
                        <div class="bg-purple-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <i data-lucide="briefcase" class="text-purple-400 w-6 h-6"></i>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-2">I offer a Service</h3>
                        <p class="text-sm text-gray-400">Join as a professional and find customers.</p>
                    </button>

                    <button id="adminBtn" class="group relative p-6 bg-[#131b2e]/80 border border-white/10 rounded-2xl hover:border-red-500/50 hover:bg-[#1a233b] transition-all duration-300 text-left hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <div class="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
                        <div class="bg-red-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <i data-lucide="shield-alert" class="text-red-400 w-6 h-6"></i>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-2">Admin Access</h3>
                        <p class="text-sm text-gray-400">Monitor platform activity and disputes.</p>
                    </button>
                </div>
            </div>

            <div id="providerForm" class="hidden w-full max-w-md bg-[#131b2e] border border-white/10 rounded-2xl p-8 shadow-2xl relative animate-fade-up mx-4 backdrop-blur-xl h-[85vh] flex flex-col">
                <div class="p-6 border-b border-white/10 flex-shrink-0">
                    <button id="backToRoleBtn" class="absolute top-6 left-4 text-gray-400 hover:text-white flex items-center text-sm"><i data-lucide="arrow-left" class="w-4 h-4 mr-1"></i> Back</button>
                    <div class="text-center mt-2">
                        <h2 class="text-2xl font-bold text-white">Partner Profile</h2>
                        <p class="text-gray-400 text-xs mt-1">Complete your registration to go live</p>
                    </div>
                </div>

                <div class="overflow-y-auto p-6 flex-1 scrollbar-hide">
                    <form id="regForm" class="space-y-5">
                        <div class="flex flex-col items-center">
                            <div class="relative group cursor-pointer" onclick="document.getElementById('regAvatarInput').click()">
                                <div class="w-24 h-24 rounded-full bg-[#0a0f1c] border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden hover:border-purple-500 transition-colors" id="regAvatarPreview">
                                    <i data-lucide="camera" class="w-8 h-8 text-gray-400"></i>
                                </div>
                                <div class="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full shadow-lg border border-[#131b2e]">
                                    <i data-lucide="plus" class="w-3 h-3 text-white"></i>
                                </div>
                                <input type="file" id="regAvatarInput" class="hidden" accept="image/*">
                            </div>
                            <span class="text-xs text-gray-500 mt-2">Upload Profile Photo</span>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                            <div class="relative">
                                <i data-lucide="user" class="absolute left-3 top-2.5 w-4 h-4 text-gray-500"></i>
                                <input type="text" id="regName" required class="w-full bg-[#0a0f1c] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-purple-500 focus:outline-none transition-all focus:ring-1 focus:ring-purple-500 text-sm" placeholder="e.g. Rahul Sharma">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Category</label>
                                <select id="regCategory" class="w-full bg-[#0a0f1c] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-purple-500 focus:outline-none text-sm appearance-none">
                                    <option value="Plumber">Plumber</option>
                                    <option value="Electrician">Electrician</option>
                                    <option value="AC Repair">AC Repair</option>
                                    <option value="Carpenter">Carpenter</option>
                                    <option value="Painters">Painters</option>
                                    <option value="Tiffin Service">Tiffin Service</option>
                                    <option value="House Helper">House Helper</option>
                                    <option value="Home Parlour">Home Parlour</option>
                                    <option value="Spa">Spa</option>
                                    <option value="Decor">Decor</option>
                                    <option value="Real Estate">Real Estate</option>
                                    <option value="Party Cook">Party Cook</option>
                                    <option value="Security">Security</option>
                                    <option value="Tutor">Tutor</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Experience</label>
                                <select id="regExperience" class="w-full bg-[#0a0f1c] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-purple-500 focus:outline-none text-sm appearance-none">
                                    <option value="Fresher">Fresher</option>
                                    <option value="1-3 Years">1-3 Years</option>
                                    <option value="3-5 Years">3-5 Years</option>
                                    <option value="5-10 Years">5-10 Years</option>
                                    <option value="10+ Years">10+ Years</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Service Location</label>
                            <div class="relative">
                                <i data-lucide="map-pin" class="absolute left-3 top-2.5 w-4 h-4 text-gray-500"></i>
                                <select id="regLocation" class="w-full bg-[#0a0f1c] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-purple-500 focus:outline-none text-sm appearance-none">
                                    <option value="Thane West">Thane West</option>
                                    <option value="Thane East">Thane East</option>
                                    <option value="Dadar">Dadar</option>
                                    <option value="Bandra">Bandra</option>
                                    <option value="Andheri">Andheri</option>
                                    <option value="Airoli">Airoli</option>
                                </select>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Visit Charge (₹)</label>
                                <input type="number" id="regPrice" required class="w-full bg-[#0a0f1c] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none text-sm" placeholder="300">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Mobile No.</label>
                                <input type="tel" id="regPhone" required class="w-full bg-[#0a0f1c] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none text-sm" placeholder="+91 XXXXX">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Bio / Description</label>
                            <textarea id="regBio" rows="2" class="w-full bg-[#0a0f1c] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none text-sm" placeholder="I am an expert in..."></textarea>
                        </div>

                        <div class="border border-dashed border-white/10 rounded-lg p-4 text-center cursor-pointer hover:bg-white/5 transition-colors group">
                            <i data-lucide="file-check" class="w-6 h-6 text-gray-500 mx-auto mb-1 group-hover:text-purple-400"></i>
                            <span class="text-xs text-gray-400">Upload Govt ID (Aadhar/PAN)</span>
                            <input type="file" class="hidden">
                        </div>

                        <button type="submit" class="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-600/30 transition-all mt-2 transform hover:-translate-y-0.5">
                            Create Profile & Go Live
                        </button>
                    </form>
                </div>
            </div>
        `;

        // 3. Append to Body
        document.body.appendChild(loginModal);

        // 4. DEFINE EVENT LISTENERS
        const roleSelection = document.getElementById('roleSelection');
        const providerForm = document.getElementById('providerForm');

        // Customer Logic
        document.getElementById('customerBtn').onclick = () => {
            loginModal.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => loginModal.remove(), 500);
        };

        // Provider Logic (Show Form)
        document.getElementById('providerBtn').onclick = () => {
            roleSelection.classList.add('hidden');
            providerForm.classList.remove('hidden');
        };

        // Admin Logic
        document.getElementById('adminBtn').onclick = () => {
            const pass = prompt("Enter Admin PIN (Demo: 1234):");
            if(pass === "1234") {
                window.location.href = "/admin";
            } else {
                alert("Incorrect PIN");
            }
        };

        // Back Button
        document.getElementById('backToRoleBtn').onclick = () => {
            providerForm.classList.add('hidden');
            roleSelection.classList.remove('hidden');
        };

        // Avatar Preview
        const avatarInput = document.getElementById('regAvatarInput');
        const avatarPreview = document.getElementById('regAvatarPreview');

        avatarInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    avatarPreview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover">`;
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });

        // Form Submit
        document.getElementById('regForm').onsubmit = (e) => {
            e.preventDefault();

            // Capture Data
            const name = document.getElementById('regName').value;
            const category = document.getElementById('regCategory').value;
            const location = document.getElementById('regLocation').value;
            const price = document.getElementById('regPrice').value;
            const phone = document.getElementById('regPhone').value;
            const experience = document.getElementById('regExperience').value;
            const bio = document.getElementById('regBio').value;

            const uploadedSrc = avatarPreview.querySelector('img')?.src;
            const avatarSrc = uploadedSrc || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;

            const newProvider = {
                id: Date.now(),
                name: name,
                category: category,
                location: location,
                rating: "5.0",
                reviews: 0,
                price: price,
                isVerified: true,
                isBusy: false,
                lat: 19.2183,
                lng: 72.9781,
                image: avatarSrc,
                phone: phone,
                experience: experience,
                isLocal: true,
                bio: bio
            };

            // Close and Render Dashboard
            loginModal.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => loginModal.remove(), 500);
            renderProviderDashboard(newProvider);
        };

        if(window.lucide) lucide.createIcons();
    }

// --- PROVIDER DASHBOARD LOGIC ---
    function renderProviderDashboard(provider) {
        // 1. Hide Customer UI Elements
        const catFilters = document.getElementById('categoryFilters');
        if(catFilters) catFilters.classList.add('hidden');

        const listToggle = document.getElementById('listViewBtn');
        if(listToggle && listToggle.parentElement) listToggle.parentElement.classList.add('hidden');

        const searchBar = document.getElementById('searchInput');
        if(searchBar && searchBar.parentElement && searchBar.parentElement.parentElement) {
            searchBar.parentElement.parentElement.classList.add('hidden');
        }

        const diagnoseBtn = document.getElementById('diagnoseBtn');
        if(diagnoseBtn) diagnoseBtn.classList.add('hidden');

        const settingsBtn = document.getElementById('settingsBtn');
        if(settingsBtn) settingsBtn.classList.add('hidden');

        // NEW: Hide the History Sidebar for Providers
        const historySidebar = document.getElementById('historySidebar');
        if(historySidebar) historySidebar.classList.add('hidden');

        // 2. Update Navbar Title
        const navTitle = document.querySelector('nav span.text-2xl');
        if(navTitle) navTitle.innerHTML = `FixIt<span class="text-purple-400">.ai</span> <span class="text-xs bg-purple-600 text-white px-2 py-1 rounded ml-2 font-bold tracking-wide">PARTNER DASHBOARD</span>`;

        // 3. Inject "Explore Items" Button
        let exploreBtn = document.getElementById('exploreItemsBtn');
        if (!exploreBtn) {
            exploreBtn = document.createElement('button');
            exploreBtn.id = 'exploreItemsBtn';
            exploreBtn.className = 'hidden md:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.4)] ml-auto';
            exploreBtn.innerHTML = `<i data-lucide="shopping-bag" class="w-5 h-5"></i> <span>Explore Items</span>`;
            exploreBtn.onclick = () => renderItemMarketplace();

            const navContainer = document.querySelector('nav .max-w-7xl');
            if(navContainer) navContainer.appendChild(exploreBtn);
        }
        exploreBtn.classList.remove('hidden');

        // 4. Render Dashboard content
        renderDashboardContent(provider);
    }
    function renderDashboardContent(provider) {
        const container = document.getElementById('contentContainer');
        container.innerHTML = `
            <div class="animate-fade-up space-y-8">
                <div>
                    <h1 class="text-3xl font-bold text-white mb-6">Welcome back, ${provider.name} 👋</h1>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="bg-[#131b2e] border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                            <div class="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
                            <div class="text-gray-400 text-sm mb-1 font-medium uppercase tracking-wider">Total Earnings</div>
                            <div class="text-3xl font-bold text-emerald-400">₹12,450</div>
                        </div>
                        <div class="bg-[#131b2e] border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                            <div class="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                            <div class="text-gray-400 text-sm mb-1 font-medium uppercase tracking-wider">Active Jobs</div>
                            <div class="text-3xl font-bold text-blue-400">3</div>
                        </div>
                        <div class="bg-[#131b2e] border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                            <div class="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors"></div>
                            <div class="text-gray-400 text-sm mb-1 font-medium uppercase tracking-wider">Rating</div>
                            <div class="text-3xl font-bold text-yellow-400">4.9 ★</div>
                        </div>
                    </div>
                </div>

                <div class="bg-[#131b2e] border border-white/10 p-6 rounded-2xl relative overflow-hidden shadow-lg">
                    <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <i data-lucide="user-cog" class="text-blue-400"></i> Profile Settings
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <div>
                                <h3 class="font-bold text-white">Availability Status</h3>
                                <p class="text-xs text-gray-400 mt-1">Toggle to appear busy or available to customers.</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="providerBusyToggle" class="sr-only peer" ${!provider.isBusy ? 'checked' : ''}>
                                <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                <span class="ml-3 text-sm font-medium ${!provider.isBusy ? 'text-emerald-400' : 'text-gray-400'}" id="busyStatusText">${!provider.isBusy ? 'Available' : 'Busy'}</span>
                            </label>
                        </div>
                        
                        <div class="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                             <label class="block text-xs font-bold text-gray-400 uppercase mb-2">Short Description / Bio</label>
                             <div class="flex gap-2">
                                 <input type="text" id="providerBioInput" value="${provider.bio || ''}" placeholder="e.g. Expert in residential pipe repairs..." class="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none text-sm transition-all">
                                 <button id="saveBioBtn" class="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-blue-500/20">Save</button>
                             </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[600px] shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-shadow">
                        <div class="p-6 border-b border-white/10 flex justify-between items-center bg-[#131b2e]">
                            <h2 class="text-xl font-bold text-white flex items-center gap-3">
                                <div class="p-2 bg-purple-500/20 rounded-lg"><i data-lucide="message-circle" class="text-purple-400 w-5 h-5"></i></div>
                                Recent Chats
                            </h2>
                            <span class="bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full">5 New</span>
                        </div>
                        <div class="overflow-y-auto p-4 space-y-2 flex-1 scrollbar-hide" id="providerChatList">
                            ${generateMockChats()}
                        </div>
                    </div>

                    <div class="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[600px] shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-shadow">
                        <div class="p-6 border-b border-white/10 flex justify-between items-center bg-[#131b2e]">
                            <h2 class="text-xl font-bold text-white flex items-center gap-3">
                                <div class="p-2 bg-blue-500/20 rounded-lg"><i data-lucide="calendar" class="text-blue-400 w-5 h-5"></i></div>
                                Upcoming Bookings
                            </h2>
                            <button class="text-gray-400 hover:text-white"><i data-lucide="filter" class="w-5 h-5"></i></button>
                        </div>
                        <div class="overflow-y-auto p-4 space-y-3 flex-1 scrollbar-hide" id="providerBookingList">
                            ${generateMockBookings()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        attachProviderListeners();

        // --- NEW: LOGIC FOR SETTINGS ---

        // 1. Handle Availability Toggle
        const toggle = document.getElementById('providerBusyToggle');
        const statusText = document.getElementById('busyStatusText');

        if(toggle) {
            toggle.onchange = () => {
                const isAvailable = toggle.checked;
                provider.isBusy = !isAvailable;

                statusText.textContent = isAvailable ? 'Available' : 'Busy';
                statusText.className = isAvailable ? 'ml-3 text-sm font-medium text-emerald-400' : 'ml-3 text-sm font-medium text-gray-400';

                // Update in Global Array (Critical for "User View" reflection)
                const globalService = allServices.find(s => s.id === provider.id || s.name === provider.name);
                if(globalService) {
                    globalService.isBusy = provider.isBusy;
                }

                // Visual Feedback
                const msg = isAvailable ? 'You are now ONLINE.' : 'You are set to BUSY.';
                alert(msg);
            };
        }

        // 2. Handle Bio Save
        const saveBtn = document.getElementById('saveBioBtn');
        if(saveBtn) {
            saveBtn.onclick = () => {
                const newBio = document.getElementById('providerBioInput').value;
                provider.bio = newBio;

                // Update Global
                const globalService = allServices.find(s => s.id === provider.id || s.name === provider.name);
                if(globalService) {
                    globalService.bio = newBio;
                }

                // Button Feedback
                saveBtn.textContent = "Saved!";
                saveBtn.classList.add("bg-green-600");
                setTimeout(() => {
                    saveBtn.textContent = "Save";
                    saveBtn.classList.remove("bg-green-600");
                }, 2000);
            };
        }

        if(window.lucide) lucide.createIcons();
    }

    // --- MARKETPLACE LOGIC (New Feature) ---
    function renderItemMarketplace() {
        const container = document.getElementById('contentContainer');

        // 1. Force Hide Main Navbar Search (User Request)
        const mainSearchBar = document.getElementById('searchInput');
        if(mainSearchBar && mainSearchBar.closest('.group')) {
             mainSearchBar.closest('.group').classList.add('hidden');
        }

        container.innerHTML = `
            <div class="animate-fade-up">
                <div class="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div>
                        <h1 class="text-3xl font-bold text-white mb-2">Explore Items</h1>
                        <p class="text-gray-400">Tools, equipment, and supplies for professionals.</p>
                    </div>

                    <div class="flex items-center gap-2 w-full md:w-auto">
                        <!-- Item Search with Image Upload (User Request 2) -->
                        <div class="relative flex-1 md:w-80">
                            <input id="itemSearchInput" type="text" placeholder="Search items or upload image..."
                                class="w-full bg-[#131b2e] border border-white/10 rounded-full pl-4 pr-20 py-2 text-sm text-white focus:border-blue-500 outline-none">

                            <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button id="itemCamBtn" class="text-gray-400 hover:text-purple-400 p-1.5 rounded-full transition-colors" title="Search by Image">
                                    <i data-lucide="camera" class="w-4 h-4"></i>
                                </button>
                                <button id="itemMicBtn" class="text-gray-400 hover:text-blue-400 p-1.5 rounded-full transition-colors" title="Voice Search">
                                    <i data-lucide="mic" class="w-4 h-4"></i>
                                </button>
                            </div>
                            <input type="file" id="itemImgInput" class="hidden" accept="image/*">
                        </div>

                        <!-- SELL ITEM BUTTON -->
                        <button id="openSellModalBtn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 transition-all shrink-0">
                            <i data-lucide="plus-circle" class="w-4 h-4"></i> Sell Item
                        </button>

                        <button onclick="document.getElementById('exploreItemsBtn').onclick()" class="text-sm text-blue-400 hover:text-white flex items-center gap-1 shrink-0 ml-2">
                            <i data-lucide="arrow-left" class="w-4 h-4"></i> Back
                        </button>
                    </div>
                </div>

                <!-- ITEM CATEGORIES -->
                <div id="itemFilters" class="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                    ${generateItemCategories()}
                </div>

                <!-- ITEMS GRID -->
                <div id="itemsGrid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <!-- SKELETON LOADER INJECTED FIRST -->
                    ${Array(4).fill(0).map(() => `
                        <div class="rounded-xl border border-white/5 bg-white/5 p-4 h-64 animate-pulse flex flex-col gap-4">
                            <div class="h-32 bg-white/10 rounded-lg"></div>
                            <div class="h-4 bg-white/10 rounded w-3/4"></div>
                            <div class="h-4 bg-white/10 rounded w-1/2"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Sell Button Listener
        document.getElementById('openSellModalBtn').onclick = createSellItemModal;

        // Back button logic
        const backBtn = container.querySelector('button[onclick*="exploreItemsBtn"]');
        if(backBtn) {
             backBtn.onclick = () => renderDashboardContent({name: "Partner"}); // Placeholder name
        }

        // Add filter listeners
        const filters = document.getElementById('itemFilters').querySelectorAll('button');
        const searchInput = document.getElementById('itemSearchInput');
        const micBtn = document.getElementById('itemMicBtn');
        const camBtn = document.getElementById('itemCamBtn');
        const imgInput = document.getElementById('itemImgInput');

        const refreshGrid = () => {
            const term = searchInput.value.toLowerCase();

            // Show Loading State (Simulated)
            document.getElementById('itemsGrid').innerHTML = Array(4).fill(0).map(() => `
                <div class="rounded-xl border border-white/5 bg-white/5 p-4 h-64 animate-pulse flex flex-col gap-4">
                    <div class="h-32 bg-white/10 rounded-lg"></div>
                    <div class="h-4 bg-white/10 rounded w-3/4"></div>
                    <div class="h-4 bg-white/10 rounded w-1/2"></div>
                </div>
            `).join('');

            // Simulate Delay for Realism
            setTimeout(() => {
                const filtered = MARKETPLACE_ITEMS.filter(i =>
                    (currentMarketplaceCategory === 'All' || i.category === currentMarketplaceCategory) &&
                    i.name.toLowerCase().includes(term)
                );
                document.getElementById('itemsGrid').innerHTML = generateItemsHTML(filtered);
                attachItemListeners(); // Re-attach click listeners
                if(window.lucide) lucide.createIcons();
            }, 800); // 0.8s delay
        };

        // Initial Load of Items
        refreshGrid();

        filters.forEach(btn => {
            btn.addEventListener('click', () => {
                filters.forEach(b => b.className = 'whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border bg-transparent text-gray-400 border-white/10 hover:text-white transition-all');
                btn.className = 'whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all';
                currentMarketplaceCategory = btn.textContent.trim();
                refreshGrid();
            });
        });

        searchInput.addEventListener('input', refreshGrid);

        micBtn.addEventListener('click', () => {
            if (!('webkitSpeechRecognition' in window)) {
                alert("Voice search only works in Chrome.");
                return;
            }
            micBtn.classList.add('text-red-500', 'animate-pulse');
            const recognition = new window.webkitSpeechRecognition();
            recognition.lang = 'en-IN';
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                searchInput.value = transcript;
                refreshGrid();
                micBtn.classList.remove('text-red-500', 'animate-pulse');
            };
            recognition.onend = () => micBtn.classList.remove('text-red-500', 'animate-pulse');
            recognition.start();
        });

        // Image Search Logic (User Request 2)
        camBtn.addEventListener('click', () => imgInput.click());

        imgInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];

                // Visual feedback
                camBtn.classList.add('text-purple-500', 'animate-pulse');
                searchInput.placeholder = `Analyzing ${file.name}...`;
                searchInput.value = "";

                // Simulation of API call
                setTimeout(() => {
                    camBtn.classList.remove('text-purple-500', 'animate-pulse');
                    searchInput.placeholder = "Search items or upload image...";
                    alert("Image analyzed! (Gemini API integration pending for visual search). Showing related items...");
                    // Placeholder for future logic:
                    // refreshGridWithKeywords(keywordsFromAI);
                }, 2000);
            }
        });
    }

    function generateItemCategories() {
        const categories = ['All', 'Plumber', 'Electrician', 'AC Repair', 'Home Nurse', 'Tiffin Service', 'Carpenter', 'Painters', 'Pest Control', 'Home Parlour'];
        return categories.map((cat, i) => `
            <button class="${i===0 ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-transparent text-gray-400 border-white/10 hover:text-white'} whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-all hover:scale-105">
                ${cat}
            </button>
        `).join('');
    }

    function generateItemsHTML(items) {
        if(items.length === 0) return `
            <div class="col-span-full text-center py-20 flex flex-col items-center opacity-0 animate-fade-up" style="animation-fill-mode: forwards;">
                <div class="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <i data-lucide="search-x" class="w-10 h-10 text-gray-500"></i>
                </div>
                <h3 class="text-xl font-bold text-white">No items found</h3>
                <p class="text-gray-400 mt-1">Try different keywords or categories.</p>
            </div>
        `;

        return items.map((item, index) => `
            <div class="marketplace-item bg-white/5 border border-white/10 rounded-xl overflow-hidden group hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] cursor-pointer animate-fade-up opacity-0 relative" style="animation-delay: ${index * 50}ms; animation-fill-mode: forwards;" data-id="${item.id}">
                ${item.isSold ? `
                <div class="absolute inset-0 z-20 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                    <span class="text-red-500 font-bold text-2xl border-4 border-red-500 px-6 py-2 -rotate-12 tracking-widest uppercase shadow-lg shadow-red-500/20">SOLD</span>
                </div>` : ''}
                <div class="h-32 bg-gray-800 relative overflow-hidden">
                    <img src="${item.image}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-110">
                    <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-yellow-400 text-xs font-bold px-2 py-1 rounded flex items-center">
                        <i data-lucide="star" class="w-3 h-3 mr-1 fill-current"></i> ${item.rating}
                    </div>
                </div>
                <div class="p-4">
                    <h3 class="font-bold text-white text-lg truncate group-hover:text-blue-400 transition-colors">${item.name}</h3>
                    <p class="text-xs text-gray-400 mb-3">${item.category}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-emerald-400 font-mono font-bold text-lg">₹${item.price}</span>
                        <div class="p-2 bg-white/10 rounded-lg text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                            <i data-lucide="chevron-right" class="w-4 h-4"></i>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // --- ITEM DETAILS MODAL (2-in-1: Buy, Rent) ---
    function createItemModal() {
        const modal = document.createElement('div');
        modal.id = 'itemDetailsModal';
        modal.className = 'fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm hidden animate-fade-up';

        modal.innerHTML = `
            <div class="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                <!-- Left: Image -->
                <div class="md:w-2/5 bg-gray-900 relative">
                    <img id="itemModalImg" src="" class="w-full h-full object-cover opacity-90">
                    <div class="absolute top-4 left-4">
                        <button id="closeItemModalBtn" class="bg-black/50 p-2 rounded-full text-white hover:bg-black/70 md:hidden"><i data-lucide="arrow-left"></i></button>
                    </div>
                </div>

                <!-- Right: Content -->
                <div class="md:w-3/5 p-6 flex flex-col">
                    <div class="flex justify-between items-start mb-1">
                        <div>
                            <span id="itemModalCat" class="text-xs font-bold text-blue-400 uppercase tracking-wide">Category</span>
                            <h2 id="itemModalName" class="text-2xl font-bold text-white mt-1">Item Name</h2>
                        </div>
                        <button id="closeItemModalBtnDesktop" class="text-gray-400 hover:text-white hidden md:block"><i data-lucide="x"></i></button>
                    </div>

                    <div class="flex items-center gap-2 mb-6">
                        <div class="flex text-yellow-400 text-sm">
                            <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                            <span id="itemModalRating" class="ml-1 font-bold">4.5</span>
                        </div>
                        <span class="text-gray-500 text-sm">• 120+ sold</span>
                    </div>

                    <!-- TABS -->
                    <div class="flex border-b border-white/10 mb-6">
                        <button class="item-tab active flex-1 pb-3 text-sm font-bold text-center border-b-2 border-blue-500 text-blue-400 transition-colors" data-tab="buy">
                            <i data-lucide="shopping-cart" class="w-4 h-4 inline mr-1"></i> Buy
                        </button>
                        <button class="item-tab flex-1 pb-3 text-sm font-bold text-center border-b-2 border-transparent text-gray-400 hover:text-white transition-colors" data-tab="rent">
                            <i data-lucide="clock" class="w-4 h-4 inline mr-1"></i> Rent
                        </button>
                    </div>

                    <!-- TAB CONTENT -->
                    <div class="flex-1 overflow-y-auto">
                        <!-- BUY TAB -->
                        <div id="tab-buy" class="item-content space-y-4 animate-fade-up">
                            <div class="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-blue-500/30 transition-colors">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-gray-300 font-medium">New Condition</span>
                                    <span class="text-emerald-400 font-bold text-xl" id="itemBuyPrice">₹2500</span>
                                </div>
                                <button id="btnBuyNew" class="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]">Buy Now</button>
                            </div>
                            <div class="p-4 bg-white/5 border border-white/5 rounded-xl opacity-80 hover:opacity-100 transition-all">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-gray-300 font-medium">Refurbished / Used</span>
                                    <span class="text-emerald-400 font-bold text-xl" id="itemUsedPrice">₹1800</span>
                                </div>
                                <div class="text-xs text-gray-500 mb-3">3 sellers available nearby</div>
                                <button id="btnBuyUsed" class="w-full py-2 border border-white/20 hover:bg-white/10 text-white font-bold rounded-lg transition-colors text-sm">View Options</button>
                            </div>
                        </div>

                        <!-- RENT TAB -->
                        <div id="tab-rent" class="item-content hidden space-y-4 animate-fade-up">
                            <div class="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-yellow-500/30 transition-colors">
                                <div class="flex justify-between items-center mb-4">
                                    <span class="text-gray-300 font-medium">Daily Rental Rate</span>
                                    <span class="text-yellow-400 font-bold text-xl" id="itemRentPrice">₹200 <span class="text-xs text-gray-500 font-normal">/day</span></span>
                                </div>
                                <div class="space-y-2 mb-4">
                                    <label class="text-xs text-gray-400 uppercase font-bold">Select Date</label>
                                    <input type="date" class="w-full bg-[#0a0f1c] border border-white/20 rounded-lg px-3 py-2 text-white outline-none focus:border-yellow-500 text-sm">
                                </div>
                                <button id="btnRentItem" class="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition-all hover:shadow-[0_0_15px_rgba(202,138,4,0.4)]">Rent Now</button>
                            </div>
                            <p class="text-xs text-gray-500 text-center"><i data-lucide="shield-check" class="w-3 h-3 inline"></i> Fully insured against damages.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close Logic
        const close = () => modal.classList.add('hidden');
        document.getElementById('closeItemModalBtn').onclick = close;
        document.getElementById('closeItemModalBtnDesktop').onclick = close;

        // Tab Logic
        const tabs = modal.querySelectorAll('.item-tab');
        const contents = modal.querySelectorAll('.item-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Reset Tabs
                tabs.forEach(t => {
                    t.classList.remove('active', 'border-blue-500', 'text-blue-400');
                    t.classList.add('border-transparent', 'text-gray-400');
                });
                // Activate Clicked
                tab.classList.add('active', 'border-blue-500', 'text-blue-400');
                tab.classList.remove('border-transparent', 'text-gray-400');

                // Show Content
                contents.forEach(c => c.classList.add('hidden'));
                document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
            });
        });
    }

    // --- SELL ITEM MODAL (New) ---
    function createSellItemModal() {
        const modal = document.createElement('div');
        modal.id = 'sellItemModal';
        modal.className = 'fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-up px-4';
        modal.innerHTML = `
            <div class="w-full max-w-md bg-[#131b2e] border border-white/10 rounded-2xl shadow-2xl p-6 relative">
                <button id="closeSellModal" class="absolute top-4 right-4 text-gray-400 hover:text-white"><i data-lucide="x"></i></button>

                <h2 class="text-2xl font-bold text-white mb-6">Sell Your Item</h2>

                <form id="sellItemForm" class="space-y-4">
                    <div class="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-white/5 transition-all group">
                        <i data-lucide="image-plus" class="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-purple-400"></i>
                        <span class="text-sm text-gray-400 block">Upload Item Photo</span>
                        <input type="file" class="hidden">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Item Name</label>
                        <input id="sellItemName" type="text" required class="w-full bg-[#0a0f1c] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none" placeholder="e.g. Bosch Drill Machine">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Category</label>
                            <select id="sellItemCategory" class="w-full bg-[#0a0f1c] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none">
                                <option value="Plumber">Plumber</option>
                                <option value="Electrician">Electrician</option>
                                <option value="Carpenter">Carpenter</option>
                                <option value="Painters">Painters</option>
                                <option value="AC Repair">AC Repair</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Price (₹)</label>
                            <input id="sellItemPrice" type="number" required class="w-full bg-[#0a0f1c] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none" placeholder="500">
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Condition/Description</label>
                        <textarea id="sellItemCondition" rows="3" class="w-full bg-[#0a0f1c] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none" placeholder="Used for 6 months, good condition..."></textarea>
                    </div>

                    <button type="submit" class="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-600/30 transition-all mt-2">
                        List Item for Sale
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        if(window.lucide) lucide.createIcons();

        document.getElementById('closeSellModal').onclick = () => modal.remove();
        document.getElementById('sellItemForm').onsubmit = (e) => {
            e.preventDefault();

            // Capture Data
            const name = document.getElementById('sellItemName').value;
            const category = document.getElementById('sellItemCategory').value;
            const price = document.getElementById('sellItemPrice').value;

            // Add to Mock Data
            const newItem = {
                id: `item-sell-${Date.now()}`,
                name: name,
                category: category,
                price: parseInt(price),
                rating: 5.0, // New listing
                image: `https://api.dicebear.com/7.x/shapes/svg?seed=${name}`, // Placeholder
                isNew: false
            };

            MARKETPLACE_ITEMS.unshift(newItem); // Add to top

            // Refresh Grid if currently viewing marketplace
            const gridContainer = document.getElementById('itemsGrid');
            if(gridContainer) {
                // If "All" or matching category is selected, refresh
                if(currentMarketplaceCategory === 'All' || currentMarketplaceCategory === category) {
                    // Re-filter and render
                    const term = document.getElementById('itemSearchInput')?.value.toLowerCase() || '';
                    const filtered = MARKETPLACE_ITEMS.filter(i =>
                        (currentMarketplaceCategory === 'All' || i.category === currentMarketplaceCategory) &&
                        i.name.toLowerCase().includes(term)
                    );
                    gridContainer.innerHTML = generateItemsHTML(filtered);
                    attachItemListeners();
                }
            }

            modal.remove();
            alert(`Success! "${name}" has been listed for sale.`);
        };
    }

    function attachItemListeners() {
        const items = document.querySelectorAll('.marketplace-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                // Find item data
                const itemData = MARKETPLACE_ITEMS.find(i => i.id === id);
                if (itemData) openItemDetails(itemData);
            });
        });
    }

    function openItemDetails(item) {
        const modal = document.getElementById('itemDetailsModal');
        // Populate Data
        document.getElementById('itemModalImg').src = item.image;
        document.getElementById('itemModalName').textContent = item.name;
        document.getElementById('itemModalCat').textContent = item.category;
        document.getElementById('itemModalRating').textContent = item.rating;

        document.getElementById('itemBuyPrice').textContent = `₹${item.price}`;
        document.getElementById('itemUsedPrice').textContent = `₹${Math.floor(item.price * 0.6)}`;
        document.getElementById('itemRentPrice').innerHTML = `₹${item.rentPrice || 200} <span class="text-xs text-gray-500 font-normal">/day</span>`;

        // Attach Payment Listeners
        const buyBtnNew = document.getElementById('btnBuyNew');
        if(buyBtnNew) buyBtnNew.onclick = () => openPaymentModal(item, 'buy', item.price);

        const buyBtnUsed = document.getElementById('btnBuyUsed');
        if(buyBtnUsed) buyBtnUsed.onclick = () => openPaymentModal(item, 'buy', Math.floor(item.price * 0.6));

        const rentBtn = document.getElementById('btnRentItem');
        if(rentBtn) rentBtn.onclick = () => openPaymentModal(item, 'rent', item.rentPrice);

        modal.classList.remove('hidden');
        if(window.lucide) lucide.createIcons();
    }

    // --- PAYMENT & BILL MODAL ---
    function openPaymentModal(item, type, price) {
        // Create modal dynamically
        const modal = document.createElement('div');
        modal.id = 'paymentModal';
        modal.className = 'fixed inset-0 z-[140] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-up px-4';

        const orderId = `ORD-${Math.floor(Math.random() * 100000)}`;
        const date = new Date().toLocaleDateString();

        modal.innerHTML = `
            <div class="w-full max-w-md bg-white text-gray-900 rounded-2xl shadow-2xl overflow-hidden relative">
                <!-- Header -->
                <div class="bg-gray-50 p-4 border-b flex justify-between items-center">
                    <h3 class="font-bold text-lg">Checkout</h3>
                    <button id="closePaymentBtn" class="text-gray-500 hover:text-black"><i data-lucide="x"></i></button>
                </div>

                <!-- Content -->
                <div id="paymentContent" class="p-6 space-y-6">
                    <!-- Order Summary -->
                    <div class="flex gap-4">
                        <img src="${item.image}" class="w-20 h-20 object-cover rounded-lg border">
                        <div>
                            <h4 class="font-bold text-lg">${item.name}</h4>
                            <p class="text-sm text-gray-500">${type === 'rent' ? 'Rental' : 'Purchase'}</p>
                            <p class="text-emerald-600 font-bold text-xl mt-1">₹${price}</p>
                        </div>
                    </div>

                    <!-- Payment Methods -->
                    <div>
                        <h4 class="font-bold text-sm text-gray-500 uppercase mb-3">Select Payment Method</h4>
                        <div class="space-y-3">
                            <label class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                <input type="radio" name="payment" value="upi" checked class="accent-blue-600">
                                <div class="flex-1 font-medium">UPI / GPay / PhonePe</div>
                                <i data-lucide="smartphone" class="w-5 h-5 text-gray-400"></i>
                            </label>
                            <label class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                <input type="radio" name="payment" value="card" class="accent-blue-600">
                                <div class="flex-1 font-medium">Credit / Debit Card</div>
                                <i data-lucide="credit-card" class="w-5 h-5 text-gray-400"></i>
                            </label>
                            <label class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                <input type="radio" name="payment" value="cod" class="accent-blue-600">
                                <div class="flex-1 font-medium">Cash on Delivery</div>
                                <i data-lucide="banknote" class="w-5 h-5 text-gray-400"></i>
                            </label>
                        </div>
                    </div>

                    <button id="confirmPayBtn" class="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                        Pay ₹${price} & Place Order
                    </button>
                </div>

                <!-- Bill/Receipt View (Hidden initially) -->
                <div id="billContent" class="hidden p-6 bg-gray-50 h-full flex flex-col items-center justify-center text-center space-y-6">
                    <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2 animate-bounce">
                        <i data-lucide="check" class="w-8 h-8"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-gray-900">Order Successful!</h3>
                        <p class="text-gray-500">Thank you for your purchase.</p>
                    </div>

                    <div class="bg-white p-6 rounded-xl border border-gray-200 w-full text-left shadow-sm space-y-3">
                        <div class="flex justify-between border-b pb-2 mb-2">
                            <span class="text-gray-500 text-xs uppercase tracking-wide">Order ID</span>
                            <span class="font-mono font-bold">${orderId}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Item</span>
                            <span class="font-medium text-right w-1/2 truncate">${item.name}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Date</span>
                            <span class="font-medium">${date}</span>
                        </div>
                        <div class="flex justify-between border-t pt-2 mt-2">
                            <span class="font-bold text-gray-900">Total Paid</span>
                            <span class="font-bold text-emerald-600">₹${price}</span>
                        </div>
                    </div>

                    <button onclick="document.getElementById('paymentModal').remove()" class="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-all">
                        Download Invoice & Close
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if(window.lucide) lucide.createIcons();

        document.getElementById('closePaymentBtn').onclick = () => modal.remove();

        document.getElementById('confirmPayBtn').onclick = () => {
            // Simulate processing
            const btn = document.getElementById('confirmPayBtn');
            btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Processing...`;
            setTimeout(() => {
                document.getElementById('paymentContent').classList.add('hidden');
                document.getElementById('billContent').classList.remove('hidden');
                // Hide header close btn to force use of main button
                document.getElementById('closePaymentBtn').classList.add('hidden');
            }, 1500);
        };
    }

    // --- SETTINGS & HISTORY UI (Customer Side) ---
    function injectSettingsUI() {
        const diagnoseBtn = document.getElementById('diagnoseBtn');
        if (diagnoseBtn && diagnoseBtn.parentElement) {
            const settingsBtn = document.createElement('button');
            settingsBtn.id = 'settingsBtn';
            settingsBtn.className = 'hidden md:flex items-center gap-2 px-3 py-2.5 ml-2 bg-[#131b2e] border border-white/10 hover:bg-white/10 rounded-full font-bold text-sm transition-all text-gray-300 hover:text-white';
            settingsBtn.innerHTML = `<i data-lucide="settings" class="w-5 h-5"></i>`;
            settingsBtn.title = "Profile & History";

            settingsBtn.addEventListener('click', createSettingsModal);

            diagnoseBtn.parentElement.appendChild(settingsBtn);
            if(window.lucide) lucide.createIcons();
        }
    }

    // --- SETTINGS & HISTORY MODAL (Updated Design) ---
    function createSettingsModal() {
        // Reuse existing modal if present
        if(document.getElementById('settingsModal')) {
            document.getElementById('settingsModal').classList.remove('hidden');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'settingsModal';
        modal.className = 'fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-up';

        // 1. Mock Data (Matches your Screenshot)
        const historyData = [
            { name: "Raju Pipes", category: "Plumber", date: "2 days ago", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Raju Pipes", status: "Completed" },
            { name: "Cool Breeze AC", category: "AC Repair", date: "1 week ago", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Cool Breeze", status: "Completed" },
            { name: "Vijay Electric", category: "Electrician", date: "2 weeks ago", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vijay Electric", status: "Cancelled" }
        ];

        // 2. Generate HTML for Cards
        const historyHTML = historyData.map(item => `
            <div class="bg-[#131b2e] border border-white/10 p-4 rounded-xl hover:border-blue-500/30 transition-all group">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <img src="${item.image}" class="w-10 h-10 rounded-full bg-gray-700 border border-white/10">
                        <div>
                            <h4 class="font-bold text-white text-sm">${item.name}</h4>
                            <p class="text-xs text-gray-400">${item.category}</p>
                        </div>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'} border">
                        ${item.status}
                    </span>
                </div>
                
                <div class="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                    <span class="text-xs text-gray-500">${item.date}</span>
                    <button onclick="openChat({name: '${item.name}', image: '${item.image}', isBusy: false})" class="text-xs font-bold text-blue-400 hover:text-white flex items-center gap-1 transition-colors">
                        <i data-lucide="rotate-ccw" class="w-3 h-3"></i> Book Again
                    </button>
                </div>
            </div>
        `).join('');

        // 3. Modal Layout
        modal.innerHTML = `
            <div class="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div class="p-6 border-b border-white/10 flex justify-between items-center bg-[#131b2e]">
                    <h2 class="text-xl font-bold text-white flex items-center gap-2">
                        <i data-lucide="user" class="text-blue-400 w-6 h-6"></i> Profile & History
                    </h2>
                    <button id="closeSettingsBtn" class="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5"><i data-lucide="x" class="w-6 h-6"></i></button>
                </div>

                <div class="overflow-y-auto p-6 space-y-8 flex-1 scrollbar-hide">
                    <div class="flex items-center gap-6 bg-white/5 p-6 rounded-xl border border-white/5">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya" class="w-20 h-20 rounded-full bg-indigo-500/20 border-2 border-indigo-500/30">
                        <div>
                            <h3 class="text-2xl font-bold text-white">Aditya Kumar</h3>
                            <p class="text-gray-400 flex items-center gap-2 mt-1 text-sm"><i data-lucide="map-pin" class="w-4 h-4 text-gray-500"></i> Thane West, Mumbai</p>
                            <p class="text-gray-400 flex items-center gap-2 mt-1 text-sm"><i data-lucide="phone" class="w-4 h-4 text-gray-500"></i> +91 98765 43210</p>
                        </div>
                        <button class="ml-auto text-sm bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-lg text-white transition-colors">Edit</button>
                    </div>

                    <div>
                        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <i data-lucide="clock" class="text-emerald-400 w-5 h-5"></i> Booking History
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${historyHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if(window.lucide) lucide.createIcons();

        // Close Listener
        document.getElementById('closeSettingsBtn').onclick = () => modal.classList.add('hidden');
    }

    // --- RATING MODAL (New) ---
    function createRatingModal(providerName) {
         const modal = document.createElement('div');
        modal.id = 'ratingModal';
        modal.className = 'fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-up px-4';

        modal.innerHTML = `
            <div class="w-full max-w-sm bg-[#131b2e] border border-white/10 rounded-2xl shadow-2xl p-6 relative text-center">
                <button onclick="this.closest('#ratingModal').remove()" class="absolute top-4 right-4 text-gray-400 hover:text-white"><i data-lucide="x"></i></button>

                <h3 class="text-xl font-bold text-white mb-2">Rate Service</h3>
                <p class="text-gray-400 text-sm mb-6">How was your experience with <span class="text-blue-400 font-bold">${providerName}</span>?</p>

                <div class="flex justify-center gap-2 mb-6">
                    ${[1,2,3,4,5].map(i => `
                        <button class="star-btn text-gray-600 hover:text-yellow-400 transition-colors" onclick="selectStar(this, ${i})">
                            <i data-lucide="star" class="w-8 h-8 fill-current"></i>
                        </button>
                    `).join('')}
                </div>

                <textarea class="w-full bg-[#0a0f1c] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 mb-4" rows="3" placeholder="Write a review (optional)..."></textarea>

                <button onclick="submitReview(this)" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">Submit Review</button>
            </div>
        `;
        document.body.appendChild(modal);
        if(window.lucide) lucide.createIcons();

        // Star Selection Logic
        window.selectStar = (btn, rating) => {
            const stars = btn.parentElement.querySelectorAll('.star-btn');
            stars.forEach((s, idx) => {
                if(idx < rating) {
                    s.classList.add('text-yellow-400');
                    s.classList.remove('text-gray-600');
                } else {
                    s.classList.remove('text-yellow-400');
                    s.classList.add('text-gray-600');
                }
            });
        };

        window.submitReview = (btn) => {
            btn.innerHTML = `<i data-lucide="check" class="w-5 h-5 inline"></i> Submitted`;
            btn.classList.add('bg-green-600', 'hover:bg-green-600');
            setTimeout(() => {
                document.getElementById('ratingModal').remove();
                alert("Thank you for your feedback!");
            }, 1000);
        };
    }

    function attachProviderListeners() {
        // ... (Same as before, moved into function for reuse) ...
        const chatItems = document.querySelectorAll('.provider-chat-item');
        chatItems.forEach(item => {
            item.addEventListener('click', () => {
                const name = item.dataset.name;
                const image = item.querySelector('img').src;
                openChat({ name: name, image: image, isBusy: false });
            });
        });

        const viewBtns = document.querySelectorAll('.btn-view-booking');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.booking-card');
                const bookingData = {
                    customer: card.dataset.name,
                    location: card.dataset.location,
                    time: card.dataset.time,
                    status: card.dataset.status
                };
                openBookingModal(bookingData);
            });
        });

        const acceptBtns = document.querySelectorAll('.btn-accept-booking');
        acceptBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.booking-card');
                const statusBadge = card.querySelector('.status-badge');
                btn.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i> Accepted`;
                btn.className = "flex-1 bg-emerald-500/20 text-emerald-400 text-sm font-bold py-2.5 rounded-lg transition-colors cursor-default border border-emerald-500/20 flex items-center justify-center gap-2";
                btn.disabled = true;
                statusBadge.textContent = 'Confirmed';
                statusBadge.className = 'status-badge text-xs font-bold px-3 py-1 rounded-full border text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
                alert(`You have accepted the booking for ${card.dataset.name}!`);
            });
        });
    }

    function generateMockChats() {
        const names = ["Amit Patel", "Sneha Roy", "Vikram Singh", "Priya Sharma", "Rahul Deshmukh", "Ananya Gupta"];
        const messages = ["Is this available tomorrow?", "Please send the quote.", "My AC is leaking water.", "Can you come at 5 PM?", "Thanks for the service!", "Address sent."];
        return names.map((name, i) => `
            <div class="provider-chat-item p-4 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-all border border-white/5 hover:border-white/20 flex items-center gap-4 group hover:scale-[1.02]" data-name="${name}">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${name}" class="w-12 h-12 rounded-full bg-gray-700">
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline mb-1">
                        <h4 class="font-bold text-white truncate group-hover:text-purple-300 transition-colors">${name}</h4>
                        <span class="text-xs text-gray-500">10:${30 + i} AM</span>
                    </div>
                    <p class="text-sm text-gray-400 truncate group-hover:text-gray-300">${messages[i]}</p>
                </div>
                ${i < 2 ? '<div class="w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>' : ''}
            </div>
        `).join('');
    }

    function generateMockBookings() {
         const customers = ["Rohan Gupta", "Anjali Mehta", "Suresh Reddy", "Meera Iyer"];
         const locations = ["Thane West", "Mulund", "Dadar", "Bandra"];
         const statuses = ["Confirmed", "Pending", "Completed", "Pending"];
         const times = ["Today, 2:00 PM", "Tomorrow, 10:00 AM", "Yesterday, 4:00 PM", "Today, 6:00 PM"];
         const statusStyles = {
             "Confirmed": "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
             "Pending": "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
             "Completed": "text-gray-400 bg-gray-400/10 border-gray-400/20"
         };
         return customers.map((name, i) => `
            <div class="booking-card p-5 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all flex flex-col gap-4 group hover:scale-[1.02]" data-name="${name}" data-location="${locations[i]}" data-status="${statuses[i]}" data-time="${times[i]}">
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-4">
                        <div class="bg-blue-500/20 w-12 h-12 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <i data-lucide="calendar-clock" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-white text-lg">${name}</h4>
                            <p class="text-sm text-gray-400 flex items-center gap-1 mt-1">
                                <i data-lucide="map-pin" class="w-3 h-3"></i> ${locations[i]}
                                <span class="mx-1">•</span>
                                <span>${times[i]}</span>
                            </p>
                        </div>
                    </div>
                    <span class="status-badge text-xs font-bold px-3 py-1 rounded-full border ${statusStyles[statuses[i]]}">${statuses[i]}</span>
                </div>
                <div class="booking-actions flex gap-3 mt-1">
                    <button class="btn-view-booking flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                        View Details
                    </button>
                    ${statuses[i] === 'Pending' ? `
                    <button class="btn-accept-booking flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2.5 rounded-lg transition-colors shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2">
                        <i data-lucide="check" class="w-4 h-4"></i> Accept
                    </button>` : ''}
                </div>
            </div>
         `).join('');
    }

    // --- BOOKING DETAILS MODAL ---
    function createBookingModal() {
        const modal = document.createElement('div');
        modal.id = 'bookingModal';
        modal.className = 'fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm hidden';
        modal.innerHTML = `
            <div class="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-6 relative">
                <button id="closeBookingBtn" class="absolute top-4 right-4 text-gray-400 hover:text-white"><i data-lucide="x"></i></button>
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="file-text" class="text-blue-400 w-8 h-8"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white">Booking Details</h2>
                </div>

                <div class="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div class="flex justify-between border-b border-white/10 pb-2">
                        <span class="text-gray-400">Customer</span>
                        <span id="bmCustomer" class="text-white font-bold">Name</span>
                    </div>
                    <div class="flex justify-between border-b border-white/10 pb-2">
                        <span class="text-gray-400">Location</span>
                        <span id="bmLocation" class="text-white">Loc</span>
                    </div>
                    <div class="flex justify-between border-b border-white/10 pb-2">
                        <span class="text-gray-400">Time</span>
                        <span id="bmTime" class="text-white">Time</span>
                    </div>
                    <div class="flex justify-between pb-2">
                        <span class="text-gray-400">Payment</span>
                        <span class="text-emerald-400 font-bold">Cash on Service</span>
                    </div>
                </div>

                <button id="bmCloseAction" class="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl mt-6">Close</button>
            </div>
        `;
        document.body.appendChild(modal);

        // Listeners
        const closeBtn = document.getElementById('closeBookingBtn');
        const actionBtn = document.getElementById('bmCloseAction');
        const closeModal = () => modal.classList.add('hidden');

        closeBtn.onclick = closeModal;
        actionBtn.onclick = closeModal;
    }

    function openBookingModal(data) {
        document.getElementById('bmCustomer').textContent = data.customer;
        document.getElementById('bmLocation').textContent = data.location;
        document.getElementById('bmTime').textContent = data.time;

        const modal = document.getElementById('bookingModal');
        modal.classList.remove('hidden');
        if(window.lucide) lucide.createIcons();
    }

    // --- API CALLS ---
    async function fetchServices() {
        // Show Skeleton Loader (User Request: Loading State)
        grid.innerHTML = Array(6).fill(0).map(() => `
            <div class="rounded-2xl border border-white/5 bg-white/5 p-4 h-64 animate-pulse flex flex-col gap-4">
                <div class="h-20 w-20 bg-white/10 rounded-xl"></div>
                <div class="flex-1 space-y-2">
                    <div class="h-6 bg-white/10 rounded w-3/4"></div>
                    <div class="h-4 bg-white/10 rounded w-1/2"></div>
                    <div class="h-4 bg-white/10 rounded w-full mt-4"></div>
                </div>
            </div>
        `).join('');

        try {
            // Simulate network delay for hackathon demo
            await new Promise(resolve => setTimeout(resolve, 1500));

            const response = await fetch('/api/services');
            let data = await response.json();

            // --- INJECT HOUSE HELPERS (User Request) ---
            const extraLocations = ["Thane West", "Mulund", "Dadar", "Bandra", "Andheri"];
            for(let i=0; i<8; i++) {
                data.push({
                    id: `hh-${i}`,
                    name: "Temp", // Will be overwritten by random names
                    category: "House Helper",
                    location: extraLocations[Math.floor(Math.random() * extraLocations.length)],
                    rating: (3.8 + Math.random() * 1.2).toFixed(1),
                    reviews: Math.floor(Math.random() * 150),
                    price: 200 + Math.floor(Math.random() * 300),
                    isVerified: true,
                    isBusy: Math.random() > 0.7,
                    lat: 19.1 + (Math.random() * 0.1),
                    lng: 72.85 + (Math.random() * 0.1),
                    image: "",
                    phone: "+91 XXXXX XXXXX",
                    experience: "5 Years"
                });
            }

            // --- INJECT ADDITIONAL CATEGORIES (User Request) ---
            const newCategories = [
                { name: "Home Parlour", priceBase: 500 },
                { name: "Spa", priceBase: 800 },
                { name: "Decor", priceBase: 2000 },
                { name: "Real Estate Agent", priceBase: 0 }, // Commission based
                { name: "Cook for House Parties", priceBase: 1500 },
                { name: "Security Guard", priceBase: 600 },
                { name: "Tutor", priceBase: 400 }
            ];

            newCategories.forEach(cat => {
                for(let i=0; i<5; i++) { // Add 5 of each for demo
                     data.push({
                        id: `${cat.name.replace(/\s/g, '')}-${i}`,
                        name: "Temp", // Will be overwritten
                        category: cat.name,
                        location: extraLocations[Math.floor(Math.random() * extraLocations.length)],
                        rating: (3.8 + Math.random() * 1.2).toFixed(1),
                        reviews: Math.floor(Math.random() * 100),
                        price: cat.priceBase + Math.floor(Math.random() * 500),
                        isVerified: Math.random() > 0.3,
                        isBusy: Math.random() > 0.7,
                        lat: 19.1 + (Math.random() * 0.1),
                        lng: 72.85 + (Math.random() * 0.1),
                        image: "",
                        phone: "+91 XXXXX XXXXX",
                        experience: `${Math.floor(Math.random() * 10) + 1} Years`
                    });
                }
            });

            // --- RANDOM NAME GENERATOR (User Request) ---
            const firstNames = [
                // Male
                "Aarav", "Vihaan", "Aditya", "Arjun", "Sai", "Rohan", "Ishaan", "Siddharth", "Vikram", "Rahul",
                "Amit", "Suresh", "Ramesh", "Manoj", "Karan", "Varun", "Nikhil", "Jay", "Omkar", "Pranav",
                // Female
                "Ananya", "Diya", "Saanvi", "Pari", "Aditi", "Riya", "Sneha", "Kavya", "Neha", "Pooja",
                "Meera", "Ishita", "Nisha", "Sanjana", "Priya", "Anjali", "Radhika", "Tanvi", "Shruti", "Aishwarya"
            ];
            const lastNames = [
                "Sharma", "Verma", "Gupta", "Patil", "Deshmukh", "Mehta", "Shah", "Singh", "Kumar", "Joshi",
                "Kulkarni", "Shinde", "Reddy", "Nair", "Malhotra", "Chopra", "Iyer", "Gaikwad", "More", "Pawar",
                "Agarwal", "Jain", "Saxena", "Trivedi", "Das"
            ];

            data = data.map(service => {
                // Pick random first and last name
                const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const fullName = `${fName} ${lName}`;

                return {
                    ...service,
                    name: fullName,
                    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`
                };
            });
            // --------------------------------------------

            // Merge with any existing local providers (if re-fetching)
            // For now, we just set it.
            // Note: If user registered BEFORE fetch completed, we need to preserve them.
            // Since fetch is async, we append `data` to `allServices` if `allServices` has local items?
            // Simplified: Just use the fetched data for now, local user handles their own push.
            if(allServices.length > 0 && allServices[0].isLocal) {
                // Keep the locally added user at top
                allServices = [allServices[0], ...data];
            } else {
                allServices = data;
            }

            generateCategoryButtons(allServices);
            renderGrid(allServices);
        } catch (error) {
            console.error('Error loading services:', error);
            grid.innerHTML = `<div class="col-span-full text-center py-20 opacity-50"><p class="text-xl text-red-400">Error loading data. Is the server running?</p></div>`;
        }
    }

    // --- DYNAMIC FILTERS (Point 2) ---
    function generateCategoryButtons(services) {
        const container = document.getElementById('categoryFilters');
        if(!container) return; // Might be missing in provider view
        container.innerHTML = ''; // Clear existing

        // Get unique categories
        const categories = ['All', ...new Set(services.map(s => s.category))];

        // MAPPING ICONS (User Request)
        const categoryIcons = {
            'All': 'layout-grid',
            'Plumber': 'wrench',
            'Electrician': 'zap',
            'AC Repair': 'thermometer-snowflake',
            'Carpenter': 'hammer',
            'Painters': 'paint-roller',
            'Tiffin Service': 'utensils',
            'House Helper': 'sparkles',
            'Pest Control': 'bug',
            'Movers & Packers': 'truck',
            'Home Nursing': 'heart-pulse',
            // New Categories
            'Home Parlour': 'scissors',
            'Spa': 'flower-2',
            'Decor': 'palette',
            'Real Estate Agent': 'home',
            'Cook for House Parties': 'chef-hat',
            'Security Guard': 'shield',
            'Tutor': 'graduation-cap',
            'Default': 'briefcase'
        };

        categories.forEach(cat => {
            const btn = document.createElement('button');
            const iconName = categoryIcons[cat] || categoryIcons['Default'];

            // Added bloom effect classes (hover:scale-105, hover:shadow-...)
            btn.className = `filter-btn whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border flex items-center gap-2
                ${cat === 'All'
                    ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105'
                    : 'bg-transparent text-gray-400 border-white/10 hover:border-purple-400/50 hover:text-white hover:bg-purple-500/10 hover:scale-105 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]'}
            `;

            btn.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4"></i> ${cat}`;

            btn.addEventListener('click', () => {
                // Update styles
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.className = 'filter-btn whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border flex items-center gap-2 bg-transparent text-gray-400 border-white/10 hover:border-purple-400/50 hover:text-white hover:bg-purple-500/10 hover:scale-105 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]';
                });
                // Active Style
                btn.className = 'filter-btn whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border flex items-center gap-2 bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105';

                currentCategory = cat;
                filterServices();
            });
            container.appendChild(btn);
        });

        if(window.lucide) lucide.createIcons();
    }

    // --- RENDERING ---
    function renderGrid(services) {
        grid.innerHTML = '';
        if (services.length === 0) {
            // User Request: Empty Result State
            grid.innerHTML = `
                <div class="col-span-full text-center py-20 flex flex-col items-center opacity-0 animate-fade-up" style="animation-fill-mode: forwards;">
                    <div class="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        <i data-lucide="search-x" class="w-10 h-10 text-gray-500"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">No services found</h3>
                    <p class="text-gray-400 mt-1">Try adjusting your search or filters.</p>
                </div>
            `;
            if(window.lucide) lucide.createIcons();
            return;
        }

        services.forEach((service, index) => {
            const isSelected = compareList.some(s => s.id === service.id);
            const card = document.createElement('div');

            // Card Click opens Modal (Point 4)
            card.onclick = () => openDetails(service);

            // Allow clicking even if busy (added cursor-pointer to busy state)
            // User Request: Smooth UI transitions (Staggered Animation)
            card.className = `relative group overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:border-blue-400/50 hover:-translate-y-2 cursor-pointer animate-fade-up opacity-0 ${service.isBusy ? 'opacity-80 grayscale' : ''}`;
            card.style.animationDelay = `${index * 50}ms`; // Stagger effect
            card.style.animationFillMode = 'forwards';

            // HIGHLIGHT LOCAL USER CARD
            if(service.isLocal) {
                card.className += ' ring-2 ring-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]';
            }

            card.innerHTML = `
                ${service.isBusy ? '<div class="absolute inset-0 bg-black/60 z-10 flex items-center justify-center pointer-events-none"><div class="bg-red-500/20 border border-red-500/50 px-4 py-2 rounded-lg text-red-200 font-bold backdrop-blur-md">BUSY NOW</div></div>' : ''}
                ${service.isLocal ? '<div class="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-20">YOU</div>' : ''}
                <div class="flex p-4 gap-4">
                    <div class="relative w-20 h-20 shrink-0">
                        <img src="${service.image}" alt="${service.name}" class="w-full h-full rounded-xl object-cover bg-indigo-900/30">
                        ${service.isVerified ? '<div class="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1 rounded-full shadow-lg shadow-blue-500/40"><i data-lucide="shield-check" class="w-3 h-3"></i></div>' : ''}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start">
                            <h3 class="font-bold text-white truncate text-lg font-grotesk group-hover:text-blue-400 transition-colors">${service.name}</h3>
                            <div class="flex items-center text-yellow-400 text-sm font-bold bg-yellow-400/10 px-1.5 py-0.5 rounded">
                                <i data-lucide="star" class="w-3 h-3 mr-1 fill-yellow-400"></i> ${service.rating}
                            </div>
                        </div>
                        <p class="text-gray-400 text-sm flex items-center mt-1"><i data-lucide="navigation" class="w-3 h-3 mr-1"></i> ${service.location}</p>
                        <p class="text-blue-300 text-xs mt-1 uppercase tracking-wider font-semibold">${service.category}</p>
                        <div class="mt-3 flex items-center justify-between">
                            <span class="text-emerald-400 font-bold text-sm">₹${service.price} <span class="text-gray-500 text-xs font-normal">/ visit</span></span>
                            <!-- Compare Button with Visual State (Point 1) -->
                            <button class="compare-btn text-xs px-4 py-1.5 rounded-full border transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/40' : 'border-white/20 text-gray-300 hover:bg-white/10'}" data-id="${service.id}">
                                ${isSelected ? 'Added' : 'Compare'}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            const compareBtn = card.querySelector('.compare-btn');
            compareBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Don't open modal
                toggleCompare(service);
            });

            grid.appendChild(card);
        });
        if(window.lucide) lucide.createIcons();
    }

    // --- FILTERING ---
    // --- SORTING LISTENER (NEW) ---
    if(sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            filterServices(); // Re-run filter/render with new sort
        });
    }
    if(searchInput) {
        searchInput.addEventListener('input', filterServices);
    }

    function filterServices() {
        const term = searchInput.value.toLowerCase();

        // 1. Filter by Category & Search
        let filtered = allServices.filter(s => {
            const matchesCat = currentCategory === 'All' || s.category === currentCategory;
            const matchesSearch = s.name.toLowerCase().includes(term) || s.category.toLowerCase().includes(term) || s.location.toLowerCase().includes(term);
            return matchesCat && matchesSearch;
        });

        // 2. Apply Sorting (NEW LOGIC)
        // Mock User Location (Thane/Mumbai Center) for Distance Calc
        const userLat = 19.1;
        const userLng = 72.85;

        switch(currentSort) {
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case 'distance':
                filtered.sort((a, b) => {
                    const distA = getDistanceFromLatLonInKm(userLat, userLng, a.lat, a.lng);
                    const distB = getDistanceFromLatLonInKm(userLat, userLng, b.lat, b.lng);
                    return distA - distB;
                });
                break;
            default: // 'recommended' - random shuffle or default order
                // Optional: Keep original order or shuffle slightly
                break;
        }

        // 3. Update UI
        if(map) updateMap(filtered);
        renderGrid(filtered);
    }
    // --- VOICE SEARCH (AI INTEGRATED) ---
    async function analyzeVoiceCommand(transcript) {
        const originalPlaceholder = searchInput.placeholder;
        searchInput.value = "";
        searchInput.placeholder = "AI Thinking...";
        searchInput.parentElement.classList.add("ring-2", "ring-purple-500");

        try {
            const prompt = `Extract the service category (e.g. Plumber, Electrician, AC Repair, Carpenter, Painters, Pest Control, Home Parlour, Tiffin Service, Home Nurse) and location from this query: '${transcript}'. Return ONLY valid JSON in this format: {"category": "...", "location": "..."}. If category is not found, use "All". If location is not found, use "".`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();
            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (aiText) {
                // Parse JSON from markdown code block if present
                const jsonStr = aiText.replace(/```json|```/g, '').trim();
                const result = JSON.parse(jsonStr);

                console.log("AI Analysis:", result);

                // Apply Filters
                if (result.category && result.category !== "All") {
                    // Find and click the category button
                    const catBtn = Array.from(document.querySelectorAll('.filter-btn')).find(b => b.textContent.trim().includes(result.category));
                    if (catBtn) {
                        catBtn.click();
                    } else {
                         // Fallback if AI hallucinates a category name slightly
                         currentCategory = result.category;
                    }
                }

                if (result.location) {
                    searchInput.value = result.location;
                    filterServices(); // Trigger filter with location text
                }
            }

        } catch (error) {
            console.error("AI Error:", error);
            // Fallback to basic text search
            searchInput.value = transcript;
            filterServices();
        } finally {
            searchInput.placeholder = originalPlaceholder;
            searchInput.parentElement.classList.remove("ring-2", "ring-purple-500");
        }
    }

    if(micBtn) {
        micBtn.addEventListener('click', () => {
            if (!('webkitSpeechRecognition' in window)) {
                alert("Voice search only works in Chrome.");
                return;
            }

            const recognition = new window.webkitSpeechRecognition();
            recognition.lang = 'en-IN'; // Indian English

            recognition.onstart = () => {
                micBtn.classList.add('bg-red-500', 'text-white', 'animate-pulse');
                searchInput.placeholder = "Listening...";
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log("Heard:", transcript);
                analyzeVoiceCommand(transcript);
                micBtn.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
            };

            recognition.onerror = (e) => {
                console.error("Speech Error", e);
                micBtn.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
            };

            recognition.onend = () => {
                micBtn.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
            };

            recognition.start();
        });
    }

    // --- COMPARISON LOGIC (Point 1 Fix) ---
    function toggleCompare(service) {
        const exists = compareList.find(s => s.id === service.id);
        if (exists) {
            compareList = compareList.filter(s => s.id !== service.id);
        } else {
            if (compareList.length >= 3) {
                alert("Max 3 items allowed for comparison");
                return;
            }
            compareList.push(service);
        }

        // --- SMART LOCATION FILTERING ---
        if (compareList.length > 0) {
            const baseLocation = compareList[0].location;
            const relevantServices = allServices.filter(s =>
                s.location === baseLocation &&
                (currentCategory === 'All' || s.category === currentCategory)
            );
            renderGrid(relevantServices);
        } else {
            filterServices();
        }

        updateComparisonUI();
    }

    function updateComparisonUI() {
        if(!compareCount) return;
        compareCount.textContent = compareList.length;

        // Auto-open drawer if 2+ items (Better UX)
        if (compareList.length >= 2) {
            comparisonDrawer.classList.remove('translate-y-full');
            if(comparisonTab.querySelector('i')) comparisonTab.querySelector('i').classList.add('rotate-180');
        }

        if (compareList.length > 0) {
            comparisonTab.classList.remove('hidden');
        } else {
            comparisonTab.classList.add('hidden');
            comparisonDrawer.classList.add('translate-y-full');
        }

        // Re-inject Labels with "Distance" row
        const labelsHTML = `
            <div class="text-gray-400 space-y-4 pt-16 font-mono text-sm">
                <div class="h-8 flex items-center">Rating</div>
                <div class="h-8 flex items-center">Price / Visit</div>
                <div class="h-8 flex items-center">Location</div>
                <div class="h-8 flex items-center">Experience</div>
                <div class="h-8 flex items-center text-blue-400">Relative Dist.</div>
            </div>
        `;

        comparisonGrid.innerHTML = labelsHTML;

        // Base location for distance calc (from first item)
        const baseItem = compareList.length > 0 ? compareList[0] : null;

        compareList.forEach((s, index) => {
            // Calculate distance relative to the first selected item
            let distanceText = "N/A";
            if(baseItem) {
                if(index === 0) {
                    distanceText = "0 km (Anchor)";
                } else {
                    const dist = getDistanceFromLatLonInKm(baseItem.lat, baseItem.lng, s.lat, s.lng);
                    distanceText = `${dist} km`;
                }
            }

            const col = document.createElement('div');
            col.className = 'relative bg-white/5 rounded-xl p-4 border border-white/10 min-w-[200px] animate-fade-up';
            col.innerHTML = `
                <button class="absolute top-2 right-2 text-gray-500 hover:text-white remove-compare"><i data-lucide="x" class="w-4 h-4"></i></button>
                <div class="mb-4 text-center">
                    <img src="${s.image}" class="w-12 h-12 rounded-full mx-auto mb-2" alt="">
                    <p class="font-bold truncate text-white">${s.name}</p>
                </div>
                <div class="space-y-4 text-center text-sm text-gray-300">
                    <div class="h-8 flex items-center justify-center font-bold text-yellow-400">${s.rating} ★</div>
                    <div class="h-8 flex items-center justify-center text-emerald-400 font-mono">₹${s.price}</div>
                    <div class="h-8 flex items-center justify-center truncate">${s.location}</div>
                    <div class="h-8 flex items-center justify-center">${s.experience || 'N/A'}</div>
                    <div class="h-8 flex items-center justify-center text-blue-400 font-mono">${distanceText}</div>
                </div>
                <button class="w-full mt-4 bg-white text-black font-bold py-2 rounded-lg text-sm hover:bg-gray-200">Call Now</button>
            `;
            col.querySelector('.remove-compare').addEventListener('click', () => toggleCompare(s));
            comparisonGrid.appendChild(col);
        });
        if(window.lucide) lucide.createIcons();
    }

    // Helper for Distance (Haversine Formula)
    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2-lat1);
        const dLon = deg2rad(lon2-lon1);
        const a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c;
        return d.toFixed(1);
    }

    function deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    if(comparisonTab) {
        comparisonTab.addEventListener('click', () => {
            comparisonDrawer.classList.toggle('translate-y-full');
            comparisonTab.querySelector('i').classList.toggle('rotate-180');
        });
    }

    if(clearCompareBtn) {
        clearCompareBtn.addEventListener('click', () => {
            compareList = [];
            renderGrid(allServices); // Reset buttons
            updateComparisonUI();
        });
    }

    // --- DETAILS MODAL (Updated for Chat & Busy Logic) ---
    // --- DETAILS MODAL (Updated with Reviews) ---
// --- DETAILS MODAL (With Google-Style Reviews) ---
    // --- DETAILS MODAL (With Scroll Fix & Reviews) ---
// --- DETAILS MODAL (With Scroll Fix & Reviews) ---
// --- DETAILS MODAL (Final Fix: Reviews + Scroll + Working Close Button) ---
    function openDetails(service) {
        const modal = document.getElementById('detailsModal');

        // 1. Populate Basic Info
        document.getElementById('detailImage').src = service.image;
        document.getElementById('detailName').textContent = service.name;
        document.getElementById('detailCategory').textContent = service.category;
        document.getElementById('detailRating').textContent = service.rating;
        document.getElementById('detailLocation').textContent = service.location;
        document.getElementById('detailPrice').textContent = service.price;
        document.getElementById('detailPhone').textContent = service.phone || "+91 98765 XXXXX";
        document.getElementById('detailExperience').textContent = service.experience || "Available";

        // 2. Inject Name Row
        const locationSpan = document.getElementById('detailLocation');
        if(locationSpan) {
            const locationRow = locationSpan.parentElement;
            const detailsContainer = locationRow.parentElement;
            let nameRow = document.getElementById('dynamicNameRow');

            if(!nameRow) {
                nameRow = document.createElement('div');
                nameRow.id = 'dynamicNameRow';
                nameRow.className = 'flex items-center text-gray-300';
                detailsContainer.insertBefore(nameRow, locationRow);
            }
            nameRow.innerHTML = `<i data-lucide="user" class="w-5 h-5 mr-3 text-gray-500"></i><span class="font-bold text-white">${service.name}</span>`;
        }

        // 3. Inject Chat/Book Buttons
        const btnContainer = modal.querySelector('.mt-8.flex.gap-3');
        if(btnContainer) {
            const chatBtnText = service.isBusy ? "Chat for Appointment" : "Chat";
            const bookBtnHTML = service.isBusy
                ? 'Busy Now'
                : `Book Visit (₹<span id="detailPrice">${service.price}</span>)`;
            const bookBtnClasses = service.isBusy
                ? 'flex-1 bg-white/10 text-white font-bold py-3 rounded-xl transition-all opacity-50 cursor-not-allowed'
                : 'flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all';

            btnContainer.innerHTML = `
                <button id="startChatBtn" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20">
                    <i data-lucide="message-circle" class="w-5 h-5"></i> ${chatBtnText}
                </button>
                <button class="${bookBtnClasses}" ${service.isBusy ? 'disabled' : ''}>
                    ${bookBtnHTML}
                </button>
            `;
            document.getElementById('startChatBtn').onclick = () => {
                if(typeof openChat === 'function') openChat(service);
            };
        }

        // --- 4. GOOGLE-STYLE REVIEW SECTION ---
        const modalContent = btnContainer.parentElement;
        let existingReviews = document.getElementById('dynamicReviewsSection');
        if(existingReviews) existingReviews.remove();

        const reviewSection = document.createElement('div');
        reviewSection.id = 'dynamicReviewsSection';
        reviewSection.className = 'mt-8 pt-6 border-t border-white/10 animate-fade-up';

        // Mock Stats
        const rating = parseFloat(service.rating);
        const reviewCount = Math.floor(Math.random() * 200) + 50;
        const distribution = [
            Math.floor(Math.random() * 60) + 40,
            Math.floor(Math.random() * 30) + 10,
            Math.floor(Math.random() * 15) + 5,
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 5)
        ];
        const totalDist = distribution.reduce((a, b) => a + b, 0);

        const getBar = (star, count) => {
            const percent = (count / totalDist) * 100;
            return `
                <div class="flex items-center gap-3 text-xs mb-1">
                    <span class="text-white font-bold w-3">${star}</span>
                    <div class="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div class="h-full bg-yellow-400 rounded-full" style="width: ${percent}%"></div>
                    </div>
                </div>
            `;
        };

        reviewSection.innerHTML = `
            <h3 class="text-xl font-bold text-white mb-6">Ratings & Reviews</h3>
            <div class="flex items-start gap-8 mb-8">
                <div class="text-center">
                    <div class="text-6xl font-bold text-white tracking-tighter">${rating}</div>
                    <div class="flex text-yellow-400 text-sm justify-center my-2 space-x-1">
                        ${Array(5).fill(0).map((_, i) => 
                            `<i data-lucide="star" class="w-4 h-4 ${i < Math.round(rating) ? 'fill-current' : 'text-gray-600'}"></i>`
                        ).join('')}
                    </div>
                    <div class="text-xs text-gray-400">${reviewCount} reviews</div>
                </div>
                <div class="flex-1 pt-1">
                    ${getBar(5, distribution[0])}
                    ${getBar(4, distribution[1])}
                    ${getBar(3, distribution[2])}
                    ${getBar(2, distribution[3])}
                    ${getBar(1, distribution[4])}
                </div>
            </div>
            <div class="space-y-6">
                ${[
                    {name: "Rahul Sharma", time: "2 days ago", stars: 5, text: "Excellent service! Fixed the leakage in 10 minutes."},
                    {name: "Priya Patil", time: "1 week ago", stars: 4, text: "Good work, but arrived slightly late."},
                    {name: "Vikram Singh", time: "3 weeks ago", stars: 5, text: "Reasonable rates and clean work."}
                ].map(rev => `
                    <div class="border-b border-white/5 pb-6 last:border-0">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                                ${rev.name.charAt(0)}
                            </div>
                            <span class="text-sm font-bold text-white">${rev.name}</span>
                        </div>
                        <div class="flex items-center gap-2 mb-2">
                            <div class="flex text-yellow-400 text-[10px] space-x-0.5">
                                ${Array(rev.stars).fill('<i data-lucide="star" class="w-3 h-3 fill-current"></i>').join('')}
                            </div>
                            <span class="text-xs text-gray-500">• ${rev.time}</span>
                        </div>
                        <p class="text-sm text-gray-300 leading-relaxed">${rev.text}</p>
                    </div>
                `).join('')}
            </div>
        `;
        modalContent.appendChild(reviewSection);

        // --- 5. FIX CLOSE BUTTON & SCROLL ---
        const innerCard = modal.firstElementChild;
        if(innerCard) {
            innerCard.style.maxHeight = '90vh';
            innerCard.style.overflowY = 'auto';
            innerCard.classList.add('scrollbar-hide');
        }

        // FORCE FIX CLOSE BUTTON
        const closeBtn = document.getElementById('closeDetailsBtn');
        if(closeBtn) {
            // Remove old clones to prevent issues (optional)
            const newBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newBtn, closeBtn);

            // Add FRESH event listener
            newBtn.onclick = () => modal.classList.add('hidden');

            // Style it to ensure it stays visible and clickable
            newBtn.style.position = 'sticky'; // Stays at top while scrolling
            newBtn.style.top = '1rem';
            newBtn.style.float = 'right';
            newBtn.style.zIndex = '100';
            newBtn.style.cursor = 'pointer';
        }

        // Show Modal
        modal.classList.remove('hidden');
        if(window.lucide) lucide.createIcons();
    }
    // --- CHAT FEATURE LOGIC ---
    function createChatModal() {
        // Create modal HTML dynamically
        const chatModal = document.createElement('div');
        chatModal.id = 'chatModal';
        chatModal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm hidden';
        chatModal.innerHTML = `
            <div class="w-full max-w-md bg-[#0b141a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden h-[600px] flex flex-col">
                <!-- Header -->
                <div class="bg-[#202c33] p-4 flex items-center justify-between border-b border-white/5">
                    <div class="flex items-center gap-3">
                        <button id="closeChatBtn" class="text-gray-400 hover:text-white"><i data-lucide="arrow-left" class="w-6 h-6"></i></button>
                        <img id="chatAvatar" src="" class="w-10 h-10 rounded-full bg-gray-700">
                        <div>
                            <h3 id="chatName" class="font-bold text-white text-sm">Provider Name</h3>
                            <span class="text-xs text-emerald-400">Online</span>
                        </div>
                    </div>
                    <button class="text-gray-400"><i data-lucide="more-vertical" class="w-5 h-5"></i></button>
                </div>

                <!-- Messages Area -->
                <div id="chatMessages" class="flex-1 overflow-y-auto p-4 space-y-4 bg-opacity-10 bg-repeat" style="background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png'); background-blend-mode: overlay; background-color: #0b141a;">
                    <!-- Messages will be injected here -->
                </div>

                <!-- Input Area -->
                <div class="bg-[#202c33] p-3 flex items-end gap-2 border-t border-white/5">
                    <button id="chatCameraBtn" class="p-2 text-gray-400 hover:text-white"><i data-lucide="camera" class="w-6 h-6"></i></button>
                    <div class="flex-1 bg-[#2a3942] rounded-lg flex items-center px-4 py-2">
                        <input id="chatInput" type="text" placeholder="Type a message" class="bg-transparent border-none outline-none text-white w-full text-sm placeholder:text-gray-500" autocomplete="off">
                    </div>
                    <button id="chatMicBtn" class="p-2 text-gray-400 hover:text-emerald-400"><i data-lucide="mic" class="w-6 h-6"></i></button>
                    <button id="chatSendBtn" class="p-2 bg-emerald-600 rounded-full text-white shadow-lg hover:bg-emerald-500"><i data-lucide="send" class="w-5 h-5"></i></button>
                </div>

                <!-- Hidden File Input -->
                <input type="file" id="chatFileInput" class="hidden" accept="image/*">
            </div>
        `;
        document.body.appendChild(chatModal);

        // Event Listeners for Chat
        document.getElementById('closeChatBtn').onclick = () => chatModal.classList.add('hidden');
        document.getElementById('chatSendBtn').onclick = sendMessage;
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if(e.key === 'Enter') sendMessage();
        });

        // Camera/Photo logic
        const fileInput = document.getElementById('chatFileInput');
        document.getElementById('chatCameraBtn').onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            if(e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => addMessage('image', e.target.result, 'sent');
                reader.readAsDataURL(e.target.files[0]);
                setTimeout(mockReply, 2000);
            }
        };

        // Mic logic
        const micBtn = document.getElementById('chatMicBtn');
        let isRecording = false;
        micBtn.onclick = () => {
            if(!isRecording) {
                isRecording = true;
                micBtn.classList.add('text-red-500', 'animate-pulse');
                document.getElementById('chatInput').placeholder = "Recording...";
            } else {
                isRecording = false;
                micBtn.classList.remove('text-red-500', 'animate-pulse');
                document.getElementById('chatInput').placeholder = "Type a message";
                addMessage('voice', 'Voice Message (0:05)', 'sent');
                setTimeout(mockReply, 2000);
            }
        };
    }

    function openChat(service) {
        const modal = document.getElementById('chatModal');
        document.getElementById('chatAvatar').src = service.image;
        document.getElementById('chatName').textContent = service.name;
        document.getElementById('chatMessages').innerHTML = `
            <div class="flex justify-center my-4">
                <span class="bg-[#202c33] text-gray-400 text-xs px-3 py-1 rounded-lg shadow uppercase">Today</span>
            </div>
            <div class="bg-[#202c33] p-3 rounded-lg border border-yellow-500/20 text-yellow-200 text-xs text-center mb-4 mx-4 shadow-sm">
                <i data-lucide="lock" class="w-3 h-3 inline mr-1"></i> Messages are end-to-end encrypted. No phone number sharing required.
            </div>
        `;
        modal.classList.remove('hidden');
        if(window.lucide) lucide.createIcons();
    }
window.openChat = openChat; // <--- ADD THIS LINE
    function sendMessage() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if(!text) return;

        addMessage('text', text, 'sent');
        input.value = '';
        setTimeout(mockReply, 1500 + Math.random() * 1000);
    }

    function addMessage(type, content, status) {
        const container = document.getElementById('chatMessages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `flex mb-2 ${status === 'sent' ? 'justify-end' : 'justify-start'}`;

        let contentHTML = '';
        if(type === 'text') {
            contentHTML = `<p class="text-sm text-white leading-relaxed">${content}</p>`;
        } else if (type === 'image') {
            contentHTML = `<img src="${content}" class="rounded-lg max-w-[200px] border border-white/10">`;
        } else if (type === 'voice') {
            contentHTML = `<div class="flex items-center gap-2 text-gray-300"><i data-lucide="play-circle" class="w-6 h-6"></i> <span>Voice Note (0:05)</span></div>`;
        }

        const bgClass = status === 'sent' ? 'bg-[#005c4b]' : 'bg-[#202c33]';
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        msgDiv.innerHTML = `
            <div class="${bgClass} px-3 py-2 rounded-lg max-w-[75%] shadow-md relative group text-white">
                ${contentHTML}
                <div class="text-[10px] text-gray-400 text-right mt-1 flex justify-end items-center gap-1">
                    ${time} ${status === 'sent' ? '<i data-lucide="check-check" class="w-3 h-3 text-blue-400"></i>' : ''}
                </div>
            </div>
        `;
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
        if(window.lucide) lucide.createIcons();
    }

    function mockReply() {
        const replies = [
            "Hello! How can I help you?",
            "Yes, I am available.",
            "Please send me a photo of the issue.",
            "Ok, I can come in the evening.",
            "That will cost around ₹400."
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        addMessage('text', randomReply, 'received');
    }

    // --- MAP VIEW ---
    if(listViewBtn && mapViewBtn) {
        listViewBtn.addEventListener('click', () => {
            grid.classList.remove('hidden');
            mapContainer.classList.add('hidden');
            listViewBtn.className = 'flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all bg-white/10 text-white';
            mapViewBtn.className = 'flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all text-gray-400 hover:text-white';
        });

        mapViewBtn.addEventListener('click', () => {
            grid.classList.add('hidden');
            mapContainer.classList.remove('hidden');
            mapViewBtn.className = 'flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all bg-white/10 text-white';
            listViewBtn.className = 'flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all text-gray-400 hover:text-white';

            if (!map) initMap();
        });
    }

    function initMap() {
        if(!window.L) return;
        map = L.map('mapContainer').setView([19.1, 72.85], 11);

        // Google Maps Tiles (Real Look)
        L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            attribution: '&copy; Google Maps',
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }).addTo(map);

        updateMap(allServices);
    }

    function updateMap(services) {
        if(!map) return;
        markers.forEach(m => map.removeLayer(m));
        markers = [];
        services.forEach(s => {
            const marker = L.marker([s.lat, s.lng]).addTo(map);
            marker.bindPopup(`<b>${s.name}</b><br>${s.category}<br>₹${s.price}<br><button onclick="alert('Call ${s.phone}')" style="margin-top:5px; background:blue; color:white; border:none; padding:2px 5px; border-radius:4px; cursor:pointer">Call</button>`);
            markers.push(marker);
        });
    }
    // --- RENDER BOOKING HISTORY SIDEBAR ---
    function renderHistorySidebar() {
        const container = document.getElementById('bookingHistoryList');
        if(!container) return;

        // Mock Data for History
        const historyItems = [
            { name: "Raju Pipes", category: "Plumber", date: "2 days ago", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Raju Pipes", status: "Completed" },
            { name: "Cool Breeze AC", category: "AC Repair", date: "1 week ago", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Cool Breeze", status: "Completed" },
            { name: "Vijay Electric", category: "Electrician", date: "2 weeks ago", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vijay Electric", status: "Cancelled" }
        ];

        container.innerHTML = historyItems.map((item, i) => `
            <div class="bg-[#131b2e] border border-white/10 p-4 rounded-xl hover:border-blue-500/30 transition-all group">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <img src="${item.image}" class="w-10 h-10 rounded-full bg-gray-700 border border-white/10">
                        <div>
                            <h4 class="font-bold text-white text-sm">${item.name}</h4>
                            <p class="text-xs text-gray-400">${item.category}</p>
                        </div>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'} border border-white/5">
                        ${item.status}
                    </span>
                </div>
                
                <div class="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                    <span class="text-xs text-gray-500">${item.date}</span>
                    <button onclick="openChat({name: '${item.name}', image: '${item.image}', isBusy: false})" class="text-xs font-bold text-blue-400 hover:text-white flex items-center gap-1 transition-colors">
                        <i data-lucide="rotate-ccw" class="w-3 h-3"></i> Book Again
                    </button>
                </div>
            </div>
        `).join('');

        if(window.lucide) lucide.createIcons();
    }
    // --- NEW: AI PROBLEM SOLVER UI ---

    // --- NEW: AI PROBLEM SOLVER UI ---
    function injectAiHelpButton() {
        // 1. Create Floating Action Button (FAB)
        const fab = document.createElement('button');
        fab.id = 'aiFabBtn';
        fab.className = 'fixed bottom-8 right-8 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:scale-110 transition-transform animate-bounce';
        fab.innerHTML = `<i data-lucide="bot" class="w-8 h-8"></i>`;
        fab.onclick = openAiProblemModal;
        document.body.appendChild(fab);

        // 2. Create the Modal HTML (Hidden by default)
        const modal = document.createElement('div');
        modal.id = 'aiProblemModal';
        modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm hidden';
        modal.innerHTML = `
            <div class="w-full max-w-lg bg-[#0f172a] border border-purple-500/30 rounded-2xl p-6 relative shadow-2xl">
                <button onclick="document.getElementById('aiProblemModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-white"><i data-lucide="x"></i></button>
                
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="brain-circuit" class="text-purple-400 w-8 h-8"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white mb-2">AI Expert Finder</h2>
                    <p class="text-gray-400 text-sm">Describe your problem (Text, Voice, or Video).<br>We will find the best expert for you.</p>
                </div>

                <div class="flex gap-2 mb-4 bg-black/20 p-1 rounded-lg">
                    <button class="flex-1 py-2 rounded-md bg-purple-600 text-white text-sm font-bold" id="tabText">Text</button>
                    <button class="flex-1 py-2 rounded-md text-gray-400 hover:text-white text-sm font-bold" id="tabVoice">Voice</button>
                    <button class="flex-1 py-2 rounded-md text-gray-400 hover:text-white text-sm font-bold" id="tabVideo">Video</button>
                </div>

                <div id="aiInputContainer" class="min-h-[150px] flex flex-col justify-center">
                    <textarea id="aiTextInput" class="w-full bg-[#1e293b] border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 outline-none focus:border-purple-500 h-32" placeholder="e.g. My kitchen sink is leaking water everywhere..."></textarea>
                </div>

                <button id="analyzeBtn" class="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2">
                    <i data-lucide="sparkles" class="w-5 h-5"></i> Analyze & Find Experts
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        if(window.lucide) lucide.createIcons();

        // --- TAB LOGIC ---
        const container = document.getElementById('aiInputContainer');
        document.getElementById('tabText').onclick = () => {
            container.innerHTML = `<textarea id="aiTextInput" class="w-full bg-[#1e293b] border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 outline-none focus:border-purple-500 h-32" placeholder="e.g. My kitchen sink is leaking water everywhere..."></textarea>`;
        };
        document.getElementById('tabVoice').onclick = () => {
            container.innerHTML = `<div class="text-center py-4"><button id="recordVoiceBtn" class="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto border-2 border-red-500/50 hover:scale-110 transition-transform"><i data-lucide="mic" class="w-8 h-8"></i></button><p class="text-gray-400 text-xs mt-3">Tap to Speak</p></div>`;
            if(window.lucide) lucide.createIcons();
            document.getElementById('recordVoiceBtn').onclick = () => {
                const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
                recognition.lang = 'en-IN';
                recognition.start();
                recognition.onresult = (e) => {
                    const text = e.results[0][0].transcript;
                    document.getElementById('tabText').click();
                    setTimeout(() => document.getElementById('aiTextInput').value = text, 100);
                };
            };
        };
        document.getElementById('tabVideo').onclick = () => {
            container.innerHTML = `<div class="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition-colors relative"><input type="file" accept="video/*" class="absolute inset-0 opacity-0 cursor-pointer" onchange="alert('Video uploaded! Analyzing frames...'); document.getElementById('tabText').click(); setTimeout(()=> document.getElementById('aiTextInput').value = 'Video Analysis: Leaking pipe detected.', 500);"><i data-lucide="video" class="w-10 h-10 text-gray-500 mx-auto mb-2"></i><span class="text-sm text-gray-400">Upload Video</span></div>`;
            if(window.lucide) lucide.createIcons();
        };

        // --- SEND TO BACKEND ---
        document.getElementById('analyzeBtn').onclick = async () => {
            const problem = document.getElementById('aiTextInput')?.value || "";
            if(!problem) return alert("Please describe the problem.");

            const btn = document.getElementById('analyzeBtn');
            btn.innerHTML = "Analyzing...";

            try {
                const response = await fetch('/api/analyze-problem', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ text: problem, location: "Thane West" })
                });
                const result = await response.json();

                document.getElementById('aiProblemModal').classList.add('hidden');
                btn.innerHTML = "Analyze";
                alert(`Diagnosis: ${result.diagnosis}`);
                renderGrid(result.providers);
            } catch(e) {
                console.error(e);
                alert("Error connecting to AI backend");
                btn.innerHTML = "Analyze";
            }
        };
    }

    function openAiProblemModal() {
        const modal = document.getElementById('aiProblemModal');
        if(modal) modal.classList.remove('hidden');
    }
});
