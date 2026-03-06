document.addEventListener("DOMContentLoaded", () => {
  const testList = document.getElementById("test-list");
  const skillOptions = document.getElementById("skill-options");
  const testOptions = document.getElementById("test-options");

  // =========================
  // 1️⃣ DỮ LIỆU CHO CÁC BỘ TEST
  // =========================
  const testData = {
    ielts: {
      name: "IELTS Placement Test",
      skills: {
        listening: ["Listening Test 1", "Listening Test 2", "Listening Test 3"],
        reading: ["Reading Test 1", "Reading Test 2"],
        writing: ["Writing Task 1", "Writing Task 2"],
        speaking: ["Speaking Part 1", "Speaking Part 2"],
        full: ["Full IELTS Placement Test"]
      }
    },
    toeic: {
      name: "TOEIC Placement Test",
      skills: {
        listening: ["Listening Set A", "Listening Set B"],
        reading: ["Reading Part 1", "Reading Part 2", "Reading Part 3"],
        full: ["Full TOEIC Placement Test"]
      } 
    } 
  }; 

  // =========================
  // 2️⃣ HIỂN THỊ CÁC BÀI TEST CHÍNH 
  // =========================
  if (testList) { 
    Object.entries(testData).forEach(([key, value]) => { 
      const btn = document.createElement("button"); 
      btn.textContent = value.name; 
      btn.classList.add(`${key}-btn`); 
      btn.onclick = () => showSkillOptions(key); 
      testList.appendChild(btn); 
    }); 
  } 

  // ========================= 
  // 3️⃣ HIỂN THỊ CÁC KỸ NĂNG  
  // ========================= 
  function showSkillOptions(testKey) { 
    testList.style.display = "none"; 
    skillOptions.style.display = "block"; 
    testOptions.style.display = "none"; 

    // Gắn sự kiện cho từng kỹ năng
    skillOptions.querySelectorAll("button").forEach(skillBtn => {
      skillBtn.onclick = () => {
        const skill = skillBtn.dataset.skill;
        showTestOptions(testKey, skill);
      };
    });
  }

  // =========================
  // 4️⃣ HIỂN THỊ DANH SÁCH ĐỀ RIÊNG CHO MỖI KỸ NĂNG
  // =========================
  function showTestOptions(testKey, skill) {
    skillOptions.style.display = "none";
    testOptions.style.display = "block";
    testOptions.innerHTML = "<h3>Select specific test</h3>";

    const tests = testData[testKey].skills[skill];
    tests.forEach((testName, index) => {
      const btn = document.createElement("button");
      btn.textContent = testName;
      btn.onclick = () => {
        const fileName = `${testKey}-${skill}${index + 1}`;
        window.location.href = `test.html?test=${fileName}`;
      };
      testOptions.appendChild(btn);
    });
  }

  // =========================
  // 5️⃣ TRANG test.html (load JSON)
  // =========================
  const testContainer = document.getElementById("test-container-inner");
  if (testContainer) {
    const params = new URLSearchParams(window.location.search);
    const testName = params.get("test");

    if (!testName) {
      testContainer.innerHTML = "<p>No test selected.</p>";
      return;
    }

    fetch(`data/${testName}.json`)
      .then(res => res.json())
      .then(data => {
        document.getElementById("test-title").textContent = data.title;
        data.questions.forEach((q, i) => {
          const block = document.createElement("div");
          block.classList.add("question-block");
          block.innerHTML = `
            <p>Q${i + 1}: ${q.question}</p>
            ${q.options
              .map(opt => `<label><input type="radio" name="q${i}" value="${opt}"> ${opt}</label>`)
              .join("")}
          `;
          testContainer.appendChild(block);
        });

        const submitBtn = document.createElement("button");
        submitBtn.textContent = "Submit";
        submitBtn.classList.add("submit-btn");
        submitBtn.onclick = () => {
          let score = 0;
          data.questions.forEach((q, i) => {
            const selected = document.querySelector(`input[name="q${i}"]:checked`);
            if (selected && selected.value === q.answer) score++;
          });

          testContainer.innerHTML = `
            <h3>Test Completed!</h3>
            <p>Your score: ${score} / ${data.questions.length}</p>
            <button class="back-btn" onclick="window.location.href='InputTesting.html'">Back</button>
          `;
        };
        testContainer.appendChild(submitBtn);
      })
      .catch(() => {
        testContainer.innerHTML = "<p style='color:red;'>Error loading test data.</p>";
      });
  }
});
