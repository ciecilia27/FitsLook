export interface ClickLog {
  id: string;
  brand: string;
  product_name: string;
  clicked_at: number;
}

export interface Feedback {
  id: string;
  name: string;
  email: string;
  message: string;
  rating: number;
  created_at: string;
}

// Generate a rich set of click logs spread over the last 30 days
export function generateDummyClickLogs(): ClickLog[] {
  const brands = [
    'Evara', 'UNIT', 'Reapin', 'Luna Luv', 'Angelique Attire', 
    'Cozy Cults', 'Wear On Street', 'Dandels', 'Imperia Culverin', 'Madfo.U'
  ];
  
  const productsMap: Record<string, string[]> = {
    'Evara': ['Forme Vest Gray', 'Forme Pants Gray', 'Forme Vest Khaki', 'Lea Top in White', 'Linen Summer Vest'],
    'UNIT': ['Orca Shirt', 'Anti Mater', 'Cyber Print Oversized Hoodie', 'UNIT Heavyweight Cargo Joggers'],
    'Reapin': ['Airbrush Boxy T-shirt Horse', 'Airbrush Boxy T-shirt Pigeon', 'Corduroy Trucker Jacket'],
    'Luna Luv': ['Turquoise Satin Black Blouse', 'Floral Print Silk Camisole', 'Luna Luv Pleated Silk Skirt'],
    'Angelique Attire': ['Florence — Glitz & Grace', 'Kemeja Amore & Marjorie', 'Kyrena Blouse', 'Angelique Puff Sleeve Top'],
    'Cozy Cults': ['Cozy Cults Item 1', 'Cozy Ribbed Loungewear Tee', 'Cozy Cults Heavyweight Hoodie'],
    'Wear On Street': ['Wear On Street Item 1', 'Graffiti Print Skate Tee', 'Wear On Street Windbreaker'],
    'Dandels': ['Dandels Item 1', 'Classic Oxford Cotton Shirt', 'Dandels Knit Mockneck Sweater'],
    'Imperia Culverin': ['Imperia Culverin Item 1', 'Embroidered Dragon Bomber', 'Imperia Velvet Blazer'],
    'Madfo.U': ['Draped Asymmetric Knit', 'Deconstructed Denim Top', 'Madfo.U Asymmetric Vest']
  };

  const logs: ClickLog[] = [];
  const now = Date.now();

  // We want to generate about 180 click logs to make the data look rich
  // We'll distribute them such that:
  // - 10 clicks in the last 24 hours
  // - 50 clicks in the last 7 days
  // - 120 clicks spread over the remaining 23 days
  
  // Also, let's distribute clicks across hours of the day to populate the Traffic Period chart:
  // Night (12am-6am), Morning (6am-12pm), Afternoon (12pm-6pm), Evening (6pm-12am)
  // Let's create different hour targets to skew the afternoon/evening traffic higher (realistic behavior)
  const getRandomHourSkewed = () => {
    const r = Math.random();
    if (r < 0.1) return Math.floor(Math.random() * 6); // 10% night
    if (r < 0.35) return Math.floor(Math.random() * 6) + 6; // 25% morning
    if (r < 0.7) return Math.floor(Math.random() * 6) + 12; // 35% afternoon
    return Math.floor(Math.random() * 6) + 18; // 30% evening
  };

  for (let i = 0; i < 180; i++) {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const brandProducts = productsMap[brand] || ['Product Item'];
    const product_name = brandProducts[Math.floor(Math.random() * brandProducts.length)];

    let clicked_at: number;
    if (i < 15) {
      // Last 24 hours (Day)
      clicked_at = now - Math.random() * 24 * 60 * 60 * 1000;
    } else if (i < 65) {
      // Last 7 days (Week)
      clicked_at = now - Math.random() * 7 * 24 * 60 * 60 * 1000;
    } else {
      // Last 30 days (Month)
      clicked_at = now - Math.random() * 30 * 24 * 60 * 60 * 1000;
    }

    // Adjust the hour of clicked_at based on our skew to make period traffic look nice
    const dateObj = new Date(clicked_at);
    dateObj.setHours(getRandomHourSkewed(), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
    clicked_at = dateObj.getTime();

    logs.push({
      id: `click_${i}`,
      brand,
      product_name,
      clicked_at
    });
  }

  // Sort chronologically
  return logs.sort((a, b) => a.clicked_at - b.clicked_at);
}

// Generate a rich set of feedback reviews spread over the last 30 days
export function generateDummyFeedbacks(): Feedback[] {
  const reviewers = [
    { name: 'Amelia K.', email: 'amelia@example.com', text: 'The AI body scan was surprisingly accurate! It measured my shoulders and hips perfectly. Trying on the UNIT Orca Shirt was seamless.', rating: 5 },
    { name: 'Marcus T.', email: 'marcus.t@outlook.com', text: 'Absolutely love the outfit switcher drawer in try-on mode. I was able to test 5 shirts in under a minute without leaving my camera feed.', rating: 5 },
    { name: 'Serena V.', email: 'serenav@gmail.com', text: 'The Evara Gray Vest fit recommendation was spot-on. Finally an online store that actually understands body proportions!', rating: 5 },
    { name: 'David L.', email: 'david.l@gmail.com', text: 'I liked the UI styling, but I hope they add more shoe options in the next catalog update.', rating: 4 },
    { name: 'Sophia R.', email: 'sophia_r@yahoo.com', text: 'The camera-based size scanning is a game changer. Super helpful for shopping between different brands.', rating: 5 },
    { name: 'Ethan W.', email: 'ethan.williams@fit.org', text: 'Clean admin controls. As a partner brand manager, I love how easy it is to toggle catalog item availability.', rating: 5 },
    { name: 'Olivia M.', email: 'olivia.m@outlook.com', text: 'Try-on loading took a bit long on my mobile connection, but once loaded, the fitting overlays are beautiful.', rating: 3 },
    { name: 'Lucas B.', email: 'lucas_b@fitlook.co.id', text: 'Excellent selection of local designers. The outfit details drawer makes browsing very straightforward.', rating: 5 },
    { name: 'Emma H.', email: 'emma.hart@example.com', text: 'The system suggested a medium for my chest size and it fit perfectly. Will buy again!', rating: 5 },
    { name: 'Liam C.', email: 'liam_c@gmail.com', text: 'A bit confused with the scanner guidelines first, but the step-by-step instructions helped.', rating: 4 },
    { name: 'Aria J.', email: 'aria.jones@example.com', text: 'The glassmorphic dark theme matches the brand vibe. The Outfit Switcher is extremely responsive.', rating: 5 },
    { name: 'Noah G.', email: 'noahg@hotmail.com', text: 'Catalog filters are quick. Average satisfaction graph is a nice touch on the dashboard.', rating: 4 },
    { name: 'Isabella F.', email: 'isabella.f@design.co', text: 'Amazing UX/UI. It feels premium and high end. Reapin Boxy T-shirts fit recommendations are spot on.', rating: 5 },
    { name: 'Mason D.', email: 'masond@example.com', text: 'I tried scanning under dim lighting and it failed, but in bright daylight it worked flawlessly.', rating: 4 },
    { name: 'Mia S.', email: 'miasingh@outlook.com', text: 'Such a sleek design. The logo displaying capsule fits the brand identity perfectly.', rating: 5 },
    { name: 'Alexander P.', email: 'alex.p@gmail.com', text: 'Highly accurate body scan. Love the detailed visual graphs in the management console.', rating: 5 },
    { name: 'Charlotte Y.', email: 'charlotte@example.com', text: 'Some item descriptions are missing. Hope they populate more detailed descriptions soon.', rating: 3 },
    { name: 'Daniel K.', email: 'danielk@fitlook.org', text: 'Great implementation of responsive navbar menus. The admin controls are super intuitive.', rating: 5 },
    { name: 'Ava N.', email: 'ava_n@gmail.com', text: 'The brand logo capsule rendering fixes are clean. Great catalog options.', rating: 5 },
    { name: 'James E.', email: 'jamese@outlook.com', text: 'Awesome virtual try-on! Standardizing fits really helps.', rating: 4 }
  ];

  const feedbacks: Feedback[] = [];
  const now = Date.now();

  reviewers.forEach((rev, idx) => {
    // Distribute these reviews over the last 30 days
    // Make sure we have feedbacks spread out to make the trend line fluctuation look good:
    // - 2 in the last 24 hours
    // - 6 in the last 7 days
    // - 12 spread over the rest of the 30 days
    let daysAgo: number;
    if (idx < 2) {
      daysAgo = Math.random() * 1;
    } else if (idx < 8) {
      daysAgo = Math.random() * 7;
    } else {
      daysAgo = Math.random() * 30;
    }

    const created_at = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    feedbacks.push({
      id: `feedback_${idx + 1}`,
      name: rev.name,
      email: rev.email,
      message: rev.text,
      rating: rev.rating,
      created_at
    });
  });

  // Sort chronologically
  return feedbacks.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

// Clean up and populate analytics localStorage keys with rich dummy data
export function initAnalyticsData(force: boolean = false): { clicks: ClickLog[]; feedbacks: Feedback[] } {
  if (typeof window === 'undefined') {
    return { clicks: [], feedbacks: [] };
  }

  let clicks: ClickLog[] = [];
  let feedbacks: Feedback[] = [];

  const rawClicks = localStorage.getItem('shopeeClicksLog');
  const rawFeedbacks = localStorage.getItem('feedbacks');

  // Parse existing data if any
  if (rawClicks) {
    try { clicks = JSON.parse(rawClicks); } catch { clicks = []; }
  }
  if (rawFeedbacks) {
    try { feedbacks = JSON.parse(rawFeedbacks); } catch { feedbacks = []; }
  }

  // Force seed or seed if data is sparse (e.g., fewer than 15 items indicating basic initial state)
  if (force || clicks.length < 15) {
    clicks = generateDummyClickLogs();
    localStorage.setItem('shopeeClicksLog', JSON.stringify(clicks));
  }

  if (force || feedbacks.length < 5) {
    feedbacks = generateDummyFeedbacks();
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
  }

  return { clicks, feedbacks };
}
