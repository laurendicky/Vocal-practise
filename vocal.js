<div id="result-wrap">
    <div id="summary">
      <div class="gauge-wrapper"></div>
      <div class="summary-info">
        <div class="score-big">0<span>%</span></div>
        <div class="headline">Awaiting your pitch...</div>
      </div>
    </div>
    <div id="feedback"></div>
  </div>

  <div id="transcript" style="margin-top: 2rem; padding: 1rem; border: 1px solid #ccc; border-radius: 8px; background-color: #fafafa; min-height: 100px;">
    <!-- Transcript will appear here -->
  </div>
  
  <!-- Existing Chart Div -->
  <div id="chart" style="margin-top: 2rem; height: 400px;"></div>
  
  <!-- Existing Script Thoughts Div -->
  <div id="script-thoughts">
    <!-- Script Thoughts feedback will be injected here -->
  </div>

  <!-- ===================== Chart.js CDN ===================== -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  
  <!-- ===================== Updated SCRIPT ===================== -->
  <script>
  document.addEventListener('DOMContentLoaded', () => {

    /* ---------- CONFIG -------------------------------------------------- */

    const OPENAI_API_KEY = "Bearer sk....."; // **Important:** Replace with your actual API key. DO NOT expose it in client-side code for production. Consider using a backend proxy.
    const OPENAI_USER = "static-guest"; // Ensure this is a valid user identifier if required by OpenAI API.

    /* ---------- Image URLs for Headers and Icons ----------------------- */

    const images = {
      "Relatability": "https://cdn.prod.website-files.com/6646266fe0ebb804079055b9/6822155d59c14944ab86180c_pink%20hand.svg",
      "Emotional Connection": "https://cdn.prod.website-files.com/6646266fe0ebb804079055b9/6822155d8fdf581595f3235a_mood%20pink.svg",
      "Clarity & Hook": "https://cdn.prod.website-files.com/6646266fe0ebb804079055b9/68258ef140a6776a7f7021d5_fishing%20pink.svg",
      "Relevance to Customer": "https://cdn.prod.website-files.com/6646266fe0ebb804079055b9/68258e48f266d11a074cb2ff_star%20tick%20pink.svg",
      "Value Proposition": "https://cdn.prod.website-files.com/6646266fe0ebb804079055b9/68258eaa65bf65cc519903b3_pink%20diamond.svg",
      "Delivery & Confidence": "https://cdn.prod.website-files.com/6646266fe0ebb804079055b9/6822155d023a7174dc63013b_microphone%20pink.svg",
      "Engagement & Interaction": "https://cdn.prod.website-files.com/6646266fe0ebb804079055b9/6822155d59c14944ab86180c_pink%20hand.svg",
      "Pronunciation Accuracy": "https://cdn.prod.website-files.com/6646266fe0ebb804079055b9/682312d8ddd3cdc2e330f06d_dartboard%20pink.svg",
      "Speech Pace": "https://cdn.prod.website-files.com/6646266fe0ebb804079055b9/682312d8f0499cffce97f99e_speed%20pink.svg",
      "Volume Control": "https://cdn.prod.website-files.com/6646266fe0ebb804079055b9/682312d8b3554eb21943ee09_volume%20pink.svg",
      "Persuasiveness": "https://cdn.prod.website-files.com/6646266fe0ebb804079055b9/68258f930e02cca261125e9e_sold%20pink.svg",
      "Business Viability": "https://cdn.prod.website-files.com/6646266fe0ebb804079055b9/68258fccf2f786d6f8ccfd5f_pink%20rocket%201.svg",
      "Financial Projections": "https://cdn.prod.website-files.com/6646266fe0ebb804079055b9/6825900e347052bb1b690bb8_flying-money%20pink.svg",
      "Structure": "https://cdn.prod.website-files.com/6646266fe0ebb804079055b9/6825907e4b8df9e7682a988f_bullet-point%20pink.svg",
      cross: "https://cdn.prod.website-files.com/6646266fe0ebb804079055b9/6822155dcd987e07c2d4c5f3_pink%20cross.svg",
      tick: "https://cdn.prod.website-files.com/6646266fe0ebb804079055b9/6822155dedcde8da59ed18fb_tick%20pink.svg"
    };

    /* ---------- Local Scoring with Expanded Metrics ---------------------- */

    function evaluatePitch(trans = "", audience = "Peer") {
      const t = trans.trim();
      const lower = t.toLowerCase();
      const words = lower.split(/\s+/).filter(Boolean);
      const wc = words.length;
      const sentences = t.split(/[.!?]+/).filter(s => s.trim().length > 2);
      const sc = sentences.length;
      const avgLen = sc ? wc / sc : wc;

      // Speech Pace Calculation
      const speechDurationInSeconds = (Date.now() - startTime) / 1000; // Convert ms to seconds
      const speechDurationInMinutes = speechDurationInSeconds / 60;
      const wpm = speechDurationInMinutes > 0 ? wc / speechDurationInMinutes : 0;

      // Volume Control Calculation
      const avgRMS = metrics.sumRMS / metrics.totalSamples;
      let volumeFeedback = "";
      if (avgRMS < 0.02) {
        volumeFeedback = "Your speaking volume is too low. Try to speak louder for better clarity.";
      } else if (avgRMS > 0.1) {
        volumeFeedback = "Your speaking volume is too high. Try to reduce it to avoid being overwhelming.";
      } else {
        volumeFeedback = "Your speaking volume is just right!";
      }

      // Pronunciation Accuracy (Basic Implementation)
      const expectedWords = trans.split(/\s+/).filter(Boolean);
      const recognizedWords = words;
      let pronunciationErrors = 0;
      for (let i = 0; i < Math.min(expectedWords.length, recognizedWords.length); i++) {
        if (expectedWords[i] !== recognizedWords[i]) {
          pronunciationErrors++;
        }
      }
      const totalWords = Math.max(expectedWords.length, recognizedWords.length);
      const pronunciationErrorRate = totalWords > 0 ? (pronunciationErrors / totalWords) : 0;
      let pronunciationFeedback = "";
      if (pronunciationErrorRate > 0.2) { // More than 20% error
        pronunciationFeedback = "There seem to be some pronunciation issues. Consider practicing difficult words.";
      } else if (pronunciationErrorRate > 0.05) { // Between 5% and 20%
        pronunciationFeedback = "You have minor pronunciation issues. Paying attention to these can improve clarity.";
      } else {
        pronunciationFeedback = "Your pronunciation is clear!";
      }

      /* ---------- New Scoring Criteria Based on Audience ----------- */

      let breakdown = {};
      let total = 0;
      let maxTotal = 0;

      // Define criteria and weightings for each audience
      const criteriaConfig = {
        "Peer": {
          "Relatability": { weight: 25 },
          "Emotional Connection": { weight: 25 },
          "Clarity & Hook": { weight: 25 },
          "Delivery & Confidence": { weight: 15 }
        },
        "Stranger": {
          "Clarity & Hook": { weight: 25 },
          "Relevance to Customer": { weight: 25 },
          "Value Proposition": { weight: 20 },
          "Delivery & Confidence": { weight: 15 },
          "Engagement & Interaction": { weight: 15 }
        },
        "Investor": {
          "Clarity & Hook": { weight: 15 },
          "Persuasiveness": { weight: 25 },
          "Business Viability": { weight: 20 },
          "Financial Projections": { weight: 15 },
          "Delivery & Confidence": { weight: 15 },
          "Structure": { weight: 10 }
        }
        // Add more audiences here if needed
      };

      const criteria = criteriaConfig[audience] || criteriaConfig["Peer"];

      // Initialize breakdown and maxTotal
      for (let key in criteria) {
        breakdown[key] = 0;
        maxTotal += criteria[key].weight;
      }

      /* ---------- Evaluate Each Criterion ----------- */

      if(audience === "Peer") {
        // Relatability
        const relatabilityRe = /\b(needs|challenges|similar|experience|story|background)\b/;
        breakdown["Relatability"] = relatabilityRe.test(lower) ? criteria["Relatability"].weight : 0;

        // Emotional Connection
        const emotionRe = /\b(passion|love|excited|believe|dream|story|journey|inspired|personal|heart)\b/;
        const firstPers = /\b(i|my|we|our)\b/;
        let emotionScore = 0;
        if (emotionRe.test(lower)) emotionScore += 10;
        if (firstPers.test(lower)) emotionScore += 5;
        if (emotionScore && sc >= 4) emotionScore += 5;
        breakdown["Emotional Connection"] = Math.min(criteria["Emotional Connection"].weight, emotionScore);

        // Clarity & Hook
        const clarityRe = /\b(clear|understandable|concise|brief|focused|specific|hook|attention-grabbing)\b/;
        const hasHook = /\b(hook|capture attention|engage|intriguing)\b/.test(lower);
        breakdown["Clarity & Hook"] = (clarityRe.test(lower) && hasHook) ? criteria["Clarity & Hook"].weight : 0;

        // Delivery & Confidence
        const filler = ["um", "uh", "like", "you", "know", "kinda", "sort", "of"],
              confident = ["will", "can", "confident", "certain", "guarantee"];
        const fillerCnt = words.filter(w => filler.includes(w)).length;
        const confCnt = words.filter(w => confident.includes(w)).length;
        let delivery = criteria["Delivery & Confidence"].weight - Math.min(criteria["Delivery & Confidence"].weight * 0.75, fillerCnt * 2) + Math.min(criteria["Delivery & Confidence"].weight * 0.75, confCnt * 2);
        delivery = Math.max(0, Math.min(criteria["Delivery & Confidence"].weight, delivery));
        breakdown["Delivery & Confidence"] = Math.round(delivery);
      }
      else if(audience === "Stranger") {
        // Clarity & Hook
        const clarityRe = /\b(clear|understandable|concise|brief|focused|specific|hook|attention-grabbing)\b/;
        const hasHook = /\b(hook|capture attention|engage|intriguing)\b/.test(lower);
        breakdown["Clarity & Hook"] = (clarityRe.test(lower) && hasHook) ? criteria["Clarity & Hook"].weight : 0;

        // Relevance to Customer
        const relevanceRe = /\b(relevant|target audience|customer needs|solution|benefits|addressing)\b/;
        breakdown["Relevance to Customer"] = relevanceRe.test(lower) ? criteria["Relevance to Customer"].weight : 0;

        // Value Proposition
        const valueRe = /\b(value|benefit|advantage|unique selling point|differentiator|benefits)\b/;
        breakdown["Value Proposition"] = valueRe.test(lower) ? criteria["Value Proposition"].weight : 0;

        // Delivery & Confidence
        const fillerStranger = ["um", "uh", "like", "you", "know", "kinda", "sort", "of"],
              confidentStranger = ["will", "can", "confident", "certain", "guarantee"];
        const fillerCntStranger = words.filter(w => fillerStranger.includes(w)).length;
        const confCntStranger = words.filter(w => confidentStranger.includes(w)).length;
        let deliveryStranger = criteria["Delivery & Confidence"].weight - Math.min(criteria["Delivery & Confidence"].weight * 0.75, fillerCntStranger * 2) + Math.min(criteria["Delivery & Confidence"].weight * 0.75, confCntStranger * 2);
        deliveryStranger = Math.max(0, Math.min(criteria["Delivery & Confidence"].weight, deliveryStranger));
        breakdown["Delivery & Confidence"] = Math.round(deliveryStranger);

        // Engagement & Interaction
        const engagementRe = /\b(engage|interact|questions|invite|discuss|involve)\b/;
        breakdown["Engagement & Interaction"] = engagementRe.test(lower) ? criteria["Engagement & Interaction"].weight : 0;
      }
      else if(audience === "Investor") {
        // Clarity & Hook
        const clarityRe = /\b(clear|understandable|concise|brief|focused|specific|hook|attention-grabbing)\b/;
        const hasHook = /\b(hook|capture attention|engage|intriguing)\b/.test(lower);
        breakdown["Clarity & Hook"] = (clarityRe.test(lower) && hasHook) ? criteria["Clarity & Hook"].weight : 0;

        // Persuasiveness
        const persuasiveRe = /\b(innovative|competitive advantage|market potential|scalable|unique|persuasive terms|convincing|compelling)\b/;
        breakdown["Persuasiveness"] = persuasiveRe.test(lower) ? criteria["Persuasiveness"].weight : 0;

        // Business Viability
        const viabilityRe = /\b(sustainable|business model|revenue streams|profitability|market fit|growth strategy|long-term)\b/;
        breakdown["Business Viability"] = viabilityRe.test(lower) ? criteria["Business Viability"].weight : 0;

        // Financial Projections
        const financialRe = /\b(projections|forecast|revenue|expenses|ROI|profit margins|financial health|investment)\b/;
        breakdown["Financial Projections"] = financialRe.test(lower) ? criteria["Financial Projections"].weight : 0;

        // Structure
        const structureRe = /\b(beginning|middle|end|organized|logical flow|clear sections|coherent|well-structured)\b/;
        breakdown["Structure"] = structureRe.test(lower) ? criteria["Structure"].weight : 0;

        // Delivery & Confidence
        const fillerInvestor = ["um", "uh", "like", "you", "know", "kinda", "sort", "of"],
              confidentInvestor = ["will", "can", "confident", "certain", "guarantee"];
        const fillerCntInvestor = words.filter(w => fillerInvestor.includes(w)).length;
        const confCntInvestor = words.filter(w => confidentInvestor.includes(w)).length;
        let deliveryInvestor = criteria["Delivery & Confidence"].weight - Math.min(criteria["Delivery & Confidence"].weight * 0.75, fillerCntInvestor * 2) + Math.min(criteria["Delivery & Confidence"].weight * 0.75, confCntInvestor * 2);
        deliveryInvestor = Math.max(0, Math.min(criteria["Delivery & Confidence"].weight, deliveryInvestor));
        breakdown["Delivery & Confidence"] = Math.round(deliveryInvestor);
      }

      // Calculate total score based on weightings
      for (let key in breakdown) {
        total += breakdown[key];
      }

      // Normalize total score to 100
      total = Math.round((total / maxTotal) * 100);

      // Summary based on score
      let summary = "";
      if(total >= 80){
        summary = "Excellent pitch! Keep up the great work.";
      } else if(total >= 60){
        summary = "Good job! There are areas to improve.";
      } else {
        summary = "Needs improvement. Focus on the key areas highlighted.";
      }

      return { score: total, summary, pronunciationFeedback, speechPace: Math.round(wpm), volumeFeedback, breakdown };
    }

    /* ---------- Gauge Drawing ------------------------------------------- */

    function drawGauge(score) {
      const wrap = document.querySelector("#summary .gauge-wrapper");
      if (!wrap) return;
      wrap.innerHTML = "";
      const size = 220, stroke = 22, radius = (size - stroke) / 2, len = Math.PI * radius,
            svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("id", "gauge"); svg.setAttribute("width", size);
      svg.setAttribute("height", size / 2);
      svg.setAttribute("viewBox", `0 0 ${size} ${size / 2}`);
      svg.innerHTML = `<defs><linearGradient id="ggrad" x1="0" x2="${size}">
        <stop offset="0%" stop-color="#7b5cff"/><stop offset="50%" stop-color="#7b5cff"/>
        <stop offset="50%" stop-color="#4480ff"/><stop offset="80%" stop-color="#4480ff"/>
        <stop offset="80%" stop-color="#22d6c6"/><stop offset="100%" stop-color="#22d6c6"/>
        </linearGradient></defs>`;

      const arc = (s, e) => {
        const r = Math.PI / 180,
              sx = size / 2 + radius * Math.cos(r * e), sy = size / 2 + radius * Math.sin(r * e),
              ex = size / 2 + radius * Math.cos(r * s), ey = size / 2 + radius * Math.sin(r * e);
        return `M${sx} ${sy} A${radius} ${radius} 0 0 1 ${ex} ${ey}`;
      };

      svg.innerHTML += `<path d="${arc(0, 180)}" stroke="#ececec" stroke-width="${stroke}"
        fill="none" stroke-linecap="round"/>`;
      const fg = document.createElementNS(svgNS, "path");
      fg.setAttribute("d", arc(0, 180)); fg.setAttribute("stroke", "url(#ggrad)");
      fg.setAttribute("stroke-width", stroke); fg.setAttribute("fill", "none");
      fg.setAttribute("stroke-linecap", "round");
      fg.setAttribute("stroke-dasharray", len); fg.setAttribute("stroke-dashoffset", len);
      svg.appendChild(fg); wrap.appendChild(svg);
      setTimeout(() => {
        fg.style.transition = "stroke-dashoffset 1.2s ease-out";
        fg.style.strokeDashoffset = len * (1 - score / 100);
      }, 50);
    }

    /* ---------- Summary & Feedback Rendering ----------------------------- */

    function renderSummaryAndFeedback(body, score, headline, pronunciationFeedback, speechPace, volumeFeedback, breakdown, transcript) {
      document.getElementById("summary").innerHTML = `
        <div class="gauge-wrapper"></div>
        <div class="summary-info">
          <div class="score-big">${score}<span>%</span></div>
          <div class="headline">${headline}</div>
        </div>`;
      drawGauge(score);

      const fb = document.getElementById("feedback");
      if (!fb) {
        console.error("Feedback element with id 'feedback' not found.");
        return;
      }

      fb.innerHTML = "";
      const lines = body.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

      // Mapping section titles to their corresponding image URLs
      const sectionMap = {
        "Relatability": images["Relatability"],
        "Emotional Connection": images["Emotional Connection"],
        "Clarity & Hook": images["Clarity & Hook"],
        "Relevance to Customer": images["Relevance to Customer"],
        "Value Proposition": images["Value Proposition"],
        "Delivery & Confidence": images["Delivery & Confidence"],
        "Engagement & Interaction": images["Engagement & Interaction"],
        // Speech Dynamics Sections
        "Pronunciation Accuracy": images["Pronunciation Accuracy"],
        "Speech Pace": images["Speech Pace"],
        "Volume Control": images["Volume Control"],
        // Investor Specific Sections
        "Persuasiveness": images["Persuasiveness"],
        "Business Viability": images["Business Viability"],
        "Financial Projections": images["Financial Projections"],
        "Structure": images["Structure"]
      };

      let sections = [];
      let currentSection = null;
      let ul = null;

      lines.forEach(line => {
        // Detect if the line matches a section header
        if (sectionMap[line]) {
          // If there's an existing section, push it to sections array
          if (currentSection) {
            sections.push(currentSection);
          }
          // Create a new feedback section
          currentSection = document.createElement("div");
          currentSection.className = "feedback-section";

          // Insert the corresponding image
          const img = document.createElement("img");
          img.src = sectionMap[line];
          img.alt = `${line} Icon`;
          img.className = "header-icon";
          currentSection.appendChild(img);

          // Create and append the header
          const h4 = document.createElement("h4");
          h4.textContent = line;
          currentSection.appendChild(h4);

          // Create and append the list
          ul = document.createElement("ul");
          currentSection.appendChild(ul);
        } else if (/^•/.test(line)) {
          // If list item is found without a preceding section
          if (!ul) {
            console.warn("List item found without a preceding header. Skipping line:", line);
            return;
          }
          const li = document.createElement("li");

          // Replace ❌ and ✅ with images
          let content = line.replace(/^•\s*/, "");
          content = content.replace("❌", `<img src="${images.cross}" alt="Bad" class="icon" />`);
          content = content.replace("✅", `<img src="${images.tick}" alt="Good" class="icon" />`);

          li.innerHTML = content;
          ul.appendChild(li);
        }
      });
      // Push the last section if it exists
      if (currentSection) {
        sections.push(currentSection);
      }

      // Segregate sections into main feedback and speech dynamics
      const mainFeedbackTitlesPeer = [
        "Relatability",
        "Emotional Connection",
        "Clarity & Hook",
        "Delivery & Confidence"
      ];
      const mainFeedbackTitlesStranger = [
        "Clarity & Hook",
        "Relevance to Customer",
        "Value Proposition",
        "Delivery & Confidence",
        "Engagement & Interaction"
      ];
      const mainFeedbackTitlesInvestor = [
        "Clarity & Hook",
        "Persuasiveness",
        "Business Viability",
        "Financial Projections",
        "Delivery & Confidence",
        "Structure"
      ];
      const speechDynamicsTitles = [
        "Pronunciation Accuracy",
        "Speech Pace",
        "Volume Control"
      ];

      // Determine and set main feedback titles based on audience
      let mainFeedbackTitles = [];
      if(audience === "Peer") {
        mainFeedbackTitles = mainFeedbackTitlesPeer;
      }
      else if(audience === "Stranger") {
        mainFeedbackTitles = mainFeedbackTitlesStranger;
      }
      else if(audience === "Investor") {
        mainFeedbackTitles = mainFeedbackTitlesInvestor;
      }
      // Add more conditions for other audiences like "Investor" if needed

      // Create main feedback grid
      const mainGrid = document.createElement("div");
      mainGrid.className = "main-feedback-grid " + audience.toLowerCase(); // Add mode-specific class

      sections.forEach((section, index) => {
        const title = section.querySelector("h4")?.textContent;
        if (mainFeedbackTitles.includes(title)) {
          mainGrid.appendChild(section);
        }
      });

      fb.appendChild(mainGrid);

      // Create Speech Dynamics header only if Speech Dynamics feedback exists
      const hasSpeechDynamics = pronunciationFeedback || speechPace || volumeFeedback;
      if(hasSpeechDynamics) {
        const speechHeader = document.createElement("h3");
        speechHeader.className = "speech-dynamics-header";
        speechHeader.textContent = "Speech Dynamics";
        fb.appendChild(speechHeader);
      }

      // Create speech dynamics grid
      const speechGrid = document.createElement("div");
      speechGrid.className = "speech-dynamics-grid";

      // Function to generate 'Insight' and 'Tip' based on feedback
      function generateFeedbackSection(title, feedback) {
        const section = document.createElement("div");
        section.className = "feedback-section";

        // Insert the corresponding image
        const img = document.createElement("img");
        img.src = images[title];
        img.alt = `${title} Icon`;
        img.className = "header-icon";
        section.appendChild(img);

        // Create and append the header
        const h4 = document.createElement("h4");
        h4.textContent = title;
        section.appendChild(h4);

        // Create and append the list
        const ul = document.createElement("ul");
        section.appendChild(ul);

        // Generate Insight and Tip
        let insight = "";
        let tip = "";

        // Simple conditional logic to generate insights and tips
        if(title === "Pronunciation Accuracy") {
          if(feedback.includes("pronunciation issues")) {
            insight = "There are noticeable pronunciation issues.";
            tip = "Consider practicing difficult words and seek feedback to improve clarity.";
          } else {
            insight = "Your pronunciation is clear.";
            tip = "Maintain your good pronunciation to enhance understanding.";
          }
        }

        if(title === "Speech Pace") {
          if(feedback.includes("too slow")) {
            insight = "Your speech pace is too slow.";
            tip = "Try to speak a bit faster to keep the audience engaged.";
          } else if(feedback.includes("too fast")) {
            insight = "Your speech pace is too fast.";
            tip = "Slow down your speech to ensure clarity and comprehension.";
          } else {
            insight = "Your speech pace is just right.";
            tip = "Keep up the good pace to maintain audience interest.";
          }
        }

        if(title === "Volume Control") {
          if(feedback.includes("too low")) {
            insight = "Your speaking volume is too low.";
            tip = "Increase your volume slightly for better audibility.";
          } else if(feedback.includes("too high")) {
            insight = "Your speaking volume is too high.";
            tip = "Reduce your volume to avoid overwhelming the audience.";
          } else {
            insight = "Your speaking volume is just right.";
            tip = "Maintain your current volume for clear communication.";
          }
        }

        if(title === "Persuasiveness") {
          if(feedback.includes("not persuasive")) {
            insight = "Your pitch lacks persuasiveness.";
            tip = "Incorporate more compelling arguments and evidence to strengthen your case.";
          } else if(feedback.includes("some persuasive elements")) {
            insight = "Your pitch has some persuasive elements.";
            tip = "Enhance the persuasiveness by highlighting unique strengths and benefits.";
          } else {
            insight = "Your pitch is highly persuasive.";
            tip = "Keep up the great work in making your pitch convincing.";
          }
        }

        if(title === "Business Viability") {
          if(feedback.includes("lacks viability")) {
            insight = "Your business viability is not clearly demonstrated.";
            tip = "Provide more details on your business model and long-term sustainability.";
          } else if(feedback.includes("some viability aspects")) {
            insight = "Your pitch covers some aspects of business viability.";
            tip = "Expand on your market strategy and operational plans to showcase viability.";
          } else {
            insight = "Your business viability is well-articulated.";
            tip = "Continue to emphasize the strengths of your business model.";
          }
        }

        if(title === "Financial Projections") {
          if(feedback.includes("unclear financials")) {
            insight = "Your financial projections are unclear.";
            tip = "Present detailed and realistic financial forecasts to support your pitch.";
          } else if(feedback.includes("adequate financial information")) {
            insight = "Your financial projections are adequate.";
            tip = "Ensure your financial data is accurate and aligns with your business goals.";
          } else {
            insight = "Your financial projections are well-presented.";
            tip = "Maintain the clarity and accuracy of your financial information.";
          }
        }

        if(title === "Structure") {
          if(feedback.includes("disorganized")) {
            insight = "Your pitch structure is disorganized.";
            tip = "Organize your pitch with a clear introduction, body, and conclusion.";
          } else if(feedback.includes("some structural issues")) {
            insight = "Your pitch has some structural issues.";
            tip = "Ensure a logical flow to make your pitch more coherent and effective.";
          } else {
            insight = "Your pitch structure is well-organized.";
            tip = "Keep maintaining a clear and logical structure in your presentations.";
          }
        }

        // Append Insight and Tip
        const liInsight = document.createElement("li");
        liInsight.innerHTML = `❌ ${insight}`;
        ul.appendChild(liInsight);

        const liTip = document.createElement("li");
        liTip.innerHTML = `✅ Tip: ${tip}`;
        ul.appendChild(liTip);

        return section;
      }

      // Generate and append each speech dynamics feedback section
      if(pronunciationFeedback || speechPace || volumeFeedback) {
        if(pronunciationFeedback) {
          const pronAccSection = generateFeedbackSection("Pronunciation Accuracy", pronunciationFeedback);
          speechGrid.appendChild(pronAccSection);
        }

        if(speechPace) {
          let paceFeedback = "";
          if(speechPace < 120) { // Assuming standard WPM: 120-150
            paceFeedback = "Your speech pace is too slow.";
          } else if(speechPace > 180) {
            paceFeedback = "Your speech pace is too fast.";
          } else {
            paceFeedback = "Your speech pace is just right.";
          }
          const speechPaceSection = generateFeedbackSection("Speech Pace", paceFeedback);
          speechGrid.appendChild(speechPaceSection);
        }

        if(volumeFeedback) {
          let volumeFeedbackProcessed = "";
          if(volumeFeedback.includes("too low")) {
            volumeFeedbackProcessed = "Your speaking volume is too low.";
          } else if(volumeFeedback.includes("too high")) {
            volumeFeedbackProcessed = "Your speaking volume is too high.";
          } else {
            volumeFeedbackProcessed = "Your speaking volume is just right.";
          }
          const volumeControlSection = generateFeedbackSection("Volume Control", volumeFeedbackProcessed);
          speechGrid.appendChild(volumeControlSection);
        }

        // Append the speech dynamics grid
        fb.appendChild(speechGrid);
      }

      // Update the chart with the new breakdown
      updateChart(breakdown);

      /* ---------- Render Script Thoughts ----------------------------- */
      if (transcript) {
        generateScriptThoughts(transcript, audience);
      }
    }

    /* ---------- Chart Initialization and Update ----------------------------- */

    let scoreChart = null;

    function initializeChart(labels, data) {
      const chartDiv = document.getElementById('chart');

      // Clear any existing canvas
      chartDiv.innerHTML = '<canvas id="scoreChart"></canvas>';

      const ctx = document.getElementById('scoreChart').getContext('2d');
      scoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Score',
            data: data,
            backgroundColor: 'rgba(30, 144, 255, 0.6)', // DodgerBlue with transparency
            borderColor: 'rgba(30, 144, 255, 1)',
            borderWidth: 1
          }]
        },
        options: {
          indexAxis: 'y', // This makes the bar chart horizontal
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              title: {
                display: false,
                text: 'Score (%)'
              }
            },
            y: {
              title: {
                display: false,
                text: 'Categories'
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.parsed.x}%`;
                }
              }
            }
          }
        }
      });
    }

    function updateChart(breakdown) {
      if(!breakdown) return;

      const labels = Object.keys(breakdown);
      const data = Object.values(breakdown);

      if(scoreChart) {
        // Update existing chart
        scoreChart.data.labels = labels;
        scoreChart.data.datasets[0].data = data;
        scoreChart.update();
      }
      else {
        // Initialize chart
        initializeChart(labels, data);
      }
    }

    /* ---------- Speech / Audio Helpers (Same as Previous) ---------------- */

    const rmsCalc = b => {
      let s = 0;
      for (const v of b) s += v * v;
      return Math.sqrt(s / b.length);
    };

    function yinPitch(b, sr){
      const th = 0.2, n = b.length >> 1, y = new Float32Array(n);
      for(let t = 1; t < n; t++){
        let sum = 0;
        for(let i = 0; i < n; i++){
          const d = b[i] - b[i + t];
          sum += d * d;
        }
        y[t] = sum;
      }
      let run = 0, est = -1;
      for(let t = 1; t < n; t++){
        run += y[t];
        y[t] *= t / run;
        if(est < 0 && y[t] < th) est = t;
      }
      if(est < 1) return 0;
      if(est < n - 1){
        const x0 = est - 1, x2 = est + 1;
        if(x0 < 1 || x2 >= n) return sr / est;
        const s0 = y[x0], s1 = y[est], s2 = y[x2], a = (s0 + s2 - 2 * s1), b = (s2 - s0) / 2;
        est = a ? est - b / (2 * a) : est;
      }
      return sr / est;
    }

    /* ---------- Runtime State ------------------------------------------- */

    let recognition, audioCtx, src, analyser, proc, stream, audioOn = false,
        startTime = 0, session = false, audience = "Peer";
    const GRACE = 800;
    let metrics = {};
    const resetMetrics = () => metrics = {
      totalSamples: 0,
      sumRMS: 0,
      pauseCount: 0,
      lastLoudTime: Date.now(),
      pitchData: [],
      sumPitch: 0,
      sumPitchSquared: 0
    };
    resetMetrics(); // Initialize metrics

    /* ---------- Result Storage for Each Audience Mode ----------- */
    
    const lastResults = {
      "Peer": null,
      "Stranger": null,
      "Investor": null
    };

    function clearAll(){
      document.getElementById("transcript").textContent = "";
      document.getElementById("summary").innerHTML = `
        <div class="gauge-wrapper"></div>
        <div class="summary-info">
          <div class="score-big">0<span>%</span></div>
          <div class="headline">Awaiting your pitch...</div>
        </div>`;
      document.getElementById("feedback").innerHTML = "";
      // Clear Script Thoughts while preserving its container
      const scriptThoughtsDiv = document.getElementById("script-thoughts");
      if(scriptThoughtsDiv){
        // Remove all child nodes except for the container itself
        while(scriptThoughtsDiv.firstChild){
          scriptThoughtsDiv.removeChild(scriptThoughtsDiv.firstChild);
        }
      }
      resetMetrics();
      startTime = 0;
      session = false;
      if(audioOn && stream){
        stream.getTracks().forEach(t => t.stop());
        audioOn = false;
      }
      // Reset chart
      if(scoreChart){
        scoreChart.destroy();
        scoreChart = null;
        document.getElementById('chart').innerHTML = '';
      }
    }

    /* ---------- SpeechRecognition & Audio ------------------------------- */

    function initRecognition(){
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if(!SR){
        alert("Speech recognition unsupported");
        return false;
      }
      recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = e => {
        let txt = "";
        for(let i = e.resultIndex; i < e.results.length; i++) {
          txt += e.results[i][0].transcript;
        }
        document.getElementById("transcript").textContent = txt.trim();
      };
      recognition.onerror = e => {
        console.error("Speech Recognition Error:", e.error);
      }
      return true;
    }

    function startAudio(){
      navigator.mediaDevices.getUserMedia({audio: true}).then(s => {
        stream = s;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        src = audioCtx.createMediaStreamSource(s);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        src.connect(analyser);
        proc = audioCtx.createScriptProcessor(2048, 1, 1);
        analyser.connect(proc);
        proc.connect(audioCtx.destination);
        metrics.lastLoudTime = Date.now();
        audioOn = true;
        proc.onaudioprocess = ev => {
          const buf = ev.inputBuffer.getChannelData(0), rms = rmsCalc(buf);
          metrics.totalSamples++;
          metrics.sumRMS += rms;
          const now = Date.now();
          if (rms > 0.02) metrics.lastLoudTime = now;
          else if (now - metrics.lastLoudTime > 1500){
            metrics.pauseCount++;
            metrics.lastLoudTime = now;
          }
          const p = yinPitch(buf, audioCtx.sampleRate);
          if(p){
            metrics.pitchData.push(p);
            metrics.sumPitch += p;
            metrics.sumPitchSquared += p * p;
          }
        };
      }).catch(e => console.error("Mic error", e));
    }

    /* ---------- Hook Up Existing Tabs ------------------------------- */

    ["peer", "stranger", "investor"].forEach(id => { // Updated IDs to include 'investor'
      const tab = document.getElementById(id);
      if(tab){
        tab.addEventListener("click", () => {
          if(id === "peer") {
            audience = "Peer";
          }
          else if(id === "stranger") {
            audience = "Stranger";
          }
          else if(id === "investor") {
            audience = "Investor";
          }

          // Since Webflow handles the active tab styling, we don't need to set it manually here
          // We'll rely on Webflow's classes to determine the active tab

          // Display the last results for the selected audience
          if(lastResults[audience]) {
            const { body, score, headline, pronunciationFeedback, speechPace, volumeFeedback, breakdown } = lastResults[audience];
            const transcript = document.getElementById("transcript").textContent.trim();
            renderSummaryAndFeedback(body, score, headline, pronunciationFeedback, speechPace, volumeFeedback, breakdown, transcript);
          }
          else {
            // Reset display to default state
            document.getElementById("summary").innerHTML = `
              <div class="gauge-wrapper"></div>
              <div class="summary-info">
                <div class="score-big">0<span>%</span></div>
                <div class="headline">Awaiting your pitch...</div>
              </div>`;
            document.getElementById("feedback").innerHTML = "";
            // Clear Script Thoughts while preserving its container
            const scriptThoughtsDiv = document.getElementById("script-thoughts");
            if(scriptThoughtsDiv){
              // Remove all child nodes except for the container itself
              while(scriptThoughtsDiv.firstChild){
                scriptThoughtsDiv.removeChild(scriptThoughtsDiv.firstChild);
              }
            }
            if(scoreChart){
              scoreChart.destroy();
              scoreChart = null;
              document.getElementById('chart').innerHTML = '';
            }
          }
        });
      } else {
        console.warn(`Tab with id '${id}' not found.`);
      }
    });

    /* ---------- Fix: Set Audience Based on Initially Active Tab ----------- */
    
    // Function to determine the initial audience based on Webflow's active tab class
    function setInitialAudience() {
      const tabsList = ["peer", "stranger", "investor"];
      let initialSelectedTabId = null;

      for(let id of tabsList){
        const tab = document.getElementById(id);
        if(tab){
          // Assuming Webflow adds a class like 'w--current' to the active tab
          // Adjust the class name based on your Webflow setup
          if(tab.classList.contains('w--current') || tab.classList.contains('active')){
            initialSelectedTabId = id;
            break;
          }
        }
      }

      if(initialSelectedTabId){
        // Programmatically trigger a click on the initially selected tab to set the audience correctly
        document.getElementById(initialSelectedTabId).click();
      }
      else{
        // If no tab is highlighted as active, default to "peer" and let Webflow handle its styling
        const peerTab = document.getElementById("peer");
        if(peerTab){
          audience = "Peer";
          // Optionally, if you want to programmatically set Peer as active, you can trigger a click
          // peerTab.click();
        }
      }
    }

    // Call the function to set the initial audience
    setInitialAudience();

    /* ---------- Start Pitch Button ------------------------------- */

    document.getElementById("startPitch")?.addEventListener("click", () => {
      clearAll();
      if(!initRecognition()) return;
      recognition.start();
      document.getElementById("startPitch").disabled = true;
      document.getElementById("stopPitch").disabled = false;
      startTime = Date.now();
      session = true;
      startAudio();
    });

    /* ---------- Stop Pitch Button ------------------------------- */

    document.getElementById("stopPitch")?.addEventListener("click", () => {
      if(!session || Date.now() - startTime < GRACE) return;
      recognition?.stop();
      document.getElementById("startPitch").disabled = false;
      document.getElementById("stopPitch").disabled = true;
      if(audioOn){
        proc.disconnect();
        analyser.disconnect();
        src.disconnect();
        stream.getTracks().forEach(t => t.stop());
        audioOn = false;
      }

      const transcript = document.getElementById("transcript").textContent.trim();
      if(!transcript){
        alert("No speech detected.");
        return;
      }

      const { score, summary, pronunciationFeedback, speechPace, volumeFeedback, breakdown } = evaluatePitch(transcript, audience);

      // Build the prompt based on audience
      let promptSections = ``;

      if(audience === "Peer") {
        promptSections = `
Relatability

• ❌ <insight>

• ✅ Tip: <suggestion>




Emotional Connection

• ❌ <insight>

• ✅ Tip: <suggestion>




Clarity & Hook

• ❌ <insight>

• ✅ Tip: <suggestion>




Delivery & Confidence

• ❌ <insight>

• ✅ Tip: <suggestion>
        `;
      }
      else if(audience === "Stranger") {
        promptSections = `
Clarity & Hook

• ❌ <insight>

• ✅ Tip: <suggestion>




Relevance to Customer

• ❌ <insight>

• ✅ Tip: <suggestion>




Value Proposition

• ❌ <insight>

• ✅ Tip: <suggestion>




Delivery & Confidence

• ❌ <insight>

• ✅ Tip: <suggestion>




Engagement & Interaction

• ❌ <insight>

• ✅ Tip: <suggestion>
        `;
      }
      else if(audience === "Investor") {
        promptSections = `
Clarity & Hook

• ❌ <insight>

• ✅ Tip: <suggestion>




Persuasiveness

• ❌ <insight>

• ✅ Tip: <suggestion>




Business Viability

• ❌ <insight>

• ✅ Tip: <suggestion>




Financial Projections

• ❌ <insight>

• ✅ Tip: <suggestion>




Delivery & Confidence

• ❌ <insight>

• ✅ Tip: <suggestion>




Structure

• ❌ <insight>

• ✅ Tip: <suggestion>
        `;
      }

      const prompt = `
Score: ${score}%

Headline: ${summary}




Return ONLY the following sections with exactly two bullets each:

${promptSections}




Rules: Each bullet must be <=2 sentences, maintain a mentor‑like tone, and include no extra text.

Transcript: """${transcript}"""
      `.trim();

      // Debugging: Log the prompt being sent
      console.log("Sending prompt to OpenAI:", prompt);

      fetch("https://api.openai.com/v1/chat/completions",{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": OPENAI_API_KEY // Already includes "Bearer ..."
        },
        body: JSON.stringify({
          model: "gpt-4",
          user: OPENAI_USER, // Include user parameter
          messages: [{ role: "user", content: prompt }],
          max_tokens: 350,
          temperature: 0.7
        })
      })
      .then(r => {
        if(!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(d => {
        const body = d.choices?.[0]?.message?.content?.trim();

        // Debugging: Log the AI response
        console.log("Received AI response:", body);

        if(body) {
          renderSummaryAndFeedback(body, score, summary, pronunciationFeedback, speechPace, volumeFeedback, breakdown, transcript);
          // Store the results for the current audience
          lastResults[audience] = { body, score, headline: summary, pronunciationFeedback, speechPace, volumeFeedback, breakdown };
        }
        else {
          document.getElementById("feedback").textContent = "No feedback.";
        }
      })
      .catch(e => {
        console.error(e);
        document.getElementById("feedback").textContent = "Error contacting GPT.";
      });

      resetMetrics();
      session = false;
    });

    /* ---------- Clear Button ------------------------------- */

    document.getElementById("clear")?.addEventListener("click", () => {
      clearAll();
      document.getElementById("startPitch").disabled = false;
      document.getElementById("stopPitch").disabled = true;
      // Optionally, clear stored results
      // lastResults["Peer"] = null;
      // lastResults["Stranger"] = null;
      // lastResults["Investor"] = null;
    });

    /* ---------- Script Thoughts Feature ------------------------------- */

    /**
     * Function to generate and render "Script Thoughts" feedback
     * @param {string} transcript - The full transcript of the user's speech
     * @param {string} audience - The current audience mode (Peer, Stranger, Investor)
     */
    function generateScriptThoughts(transcript, audience) {
      const scriptThoughtsDiv = document.getElementById("script-thoughts");
      if (!scriptThoughtsDiv) {
        console.error("Script Thoughts element with id 'script-thoughts' not found.");
        return;
      }

      if (!transcript) {
        console.warn("No transcript available for generating Script Thoughts.");
        return;
      }

      // Build the prompt for Script Thoughts
      const prompt = `
Analyze the following transcript and identify the most important moments—key phrases or powerful lines—that stand out.

For each key moment, provide:
- The exact words spoken.
- An analysis of the emotional tone (e.g., "That sounded determined," "This felt warm and friendly").
- A recommended quick delivery tip (e.g., "Try pausing here," "Raise your pitch on this word").
- A reference to the transcript location using the sentence number (e.g., "Sentence 3").

Transcript: """${transcript}"""

Please ensure the output strictly follows the JSON format below, without any additional text:

[
  {
    "phrase": "Exact words spoken",
    "emotion": "Emotional tone analysis",
    "tip": "Delivery tip",
    "timestamp": Integer representing the sentence number
  },
  ...
]
      `.trim();

      // Debugging: Log the prompt being sent
      console.log("Sending Script Thoughts prompt to OpenAI:", prompt);

      fetch("https://api.openai.com/v1/chat/completions",{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": OPENAI_API_KEY // Already includes "Bearer ..."
        },
        body: JSON.stringify({
          model: "gpt-4",
          user: OPENAI_USER, // Include user parameter
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500,
          temperature: 0.7
        })
      })
      .then(r => {
        if(!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(d => {
        const response = d.choices?.[0]?.message?.content?.trim();

        // Debugging: Log the AI response
        console.log("Received Script Thoughts response:", response);

        try {
          // Ensure the response starts with [ to be valid JSON array
          if (!response.startsWith("[")) throw new Error("Invalid JSON format");

          const scriptThoughts = JSON.parse(response);
          renderScriptThoughts(scriptThoughts, transcript);
        } catch (error) {
          console.error("Error parsing Script Thoughts JSON:", error);
          // Display an error message within script-thoughts div
          scriptThoughtsDiv.innerHTML += `<p>Error generating Script Thoughts feedback.</p>`;
        }
      })
      .catch(e => {
        console.error("Error fetching Script Thoughts:", e);
        // Display an error message within script-thoughts div
        scriptThoughtsDiv.innerHTML += `<p>Error generating Script Thoughts feedback. Please try again later.</p>`;
      });
    }

    /**
     * Function to render "Script Thoughts" into the designated div
     * @param {Array} scriptThoughts - Array of script thoughts objects
     * @param {string} transcript - The full transcript (for linking purposes)
     */
    function renderScriptThoughts(scriptThoughts, transcript) {
      const scriptThoughtsDiv = document.getElementById("script-thoughts");

      // Split transcript into sentences
      const sentences = transcript.match(/[^\.!\?]+[\.!\?]+/g) || [];

      scriptThoughts.forEach(thought => {
        const { phrase, emotion, tip, timestamp } = thought;

        // Validate timestamp: must be an integer representing the sentence number
        const sentenceIndex = parseInt(timestamp) - 1;
        if(isNaN(sentenceIndex) || sentenceIndex < 0 || sentenceIndex >= sentences.length){
          console.warn(`Invalid timestamp "${timestamp}" for phrase "${phrase}".`);
          return;
        }

        // Create a unique ID for the phrase
        const sentence = sentences[sentenceIndex];
        const phraseIndex = sentence.indexOf(phrase);
        if(phraseIndex === -1){
          console.warn(`Phrase "${phrase}" not found in sentence ${timestamp}.`);
          return;
        }
        const phraseId = `phrase-${sentenceIndex}-${phraseIndex}`;

        // Wrap the phrase in the transcript with a span for linking
        const transcriptDiv = document.getElementById("transcript");
        let modifiedTranscript = transcriptDiv.innerHTML || transcriptDiv.textContent;
        const phraseRegex = new RegExp(`(${escapeRegExp(phrase)})`);
        // Replace only the first occurrence to prevent multiple replacements
        modifiedTranscript = modifiedTranscript.replace(phraseRegex, `<span id="${phraseId}" class="phrase">${phrase}</span>`);
        transcriptDiv.innerHTML = modifiedTranscript;

        // Create the Script Thought item
        const item = document.createElement("div");
        item.className = "script-thought-item";

        // Timestamp or reference
        const timestampElem = document.createElement("div");
        timestampElem.className = "timestamp";
        timestampElem.textContent = `Sentence ${timestamp}`;
        item.appendChild(timestampElem);

        // Phrase with link
        const phraseElem = document.createElement("div");
        phraseElem.className = "phrase";
        phraseElem.innerHTML = `<a href="#${phraseId}">${phrase}</a>`;
        item.appendChild(phraseElem);

        // Emotion analysis
        const emotionElem = document.createElement("div");
        emotionElem.className = "emotion";
        emotionElem.textContent = emotion;
        item.appendChild(emotionElem);

        // Delivery tip
        const tipElem = document.createElement("div");
        tipElem.className = "tip";
        tipElem.textContent = tip;
        item.appendChild(tipElem);

        // Append the item to Script Thoughts div
        scriptThoughtsDiv.appendChild(item);
      });
    }

    /**
     * Utility function to escape RegExp special characters in a string
     * @param {string} string
     * @returns {string}
     */
    function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }





