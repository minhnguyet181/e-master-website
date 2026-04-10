#!/usr/bin/env node
/**
 * Build all Cambridge IELTS 17 tests (Listening, Reading T2-T4, Writing, Speaking)
 * Run from Back-end/: node scripts/build-cam17-all.js
 */
const fs = require('fs');
const path = require('path');
const OUT_DIR = path.join(__dirname, '../../generated-tests-v2');
const TESTS_DIR = path.join(OUT_DIR, 'tests');
if (!fs.existsSync(TESTS_DIR)) fs.mkdirSync(TESTS_DIR, { recursive: true });

// Audio base URL served from frontend public folder
const AUDIO_BASE = '/audio/cam17';

// ─── HELPERS ────────────────────────────────────────────────────────────────
function q(no, type, prompt, options, answer, pts = 1, meta = null) {
  return { question_no: no, question_type: type, prompt, options, correct_answer: answer, points: pts, ...(meta ? { metadata: meta } : {}) };
}
function tfng(no, prompt, answer) { return q(no, 'TRUE_FALSE_NOT_GIVEN', prompt, ['TRUE','FALSE','NOT GIVEN'], answer); }
function ynng(no, prompt, answer) { return q(no, 'YES_NO_NOT_GIVEN', prompt, ['YES','NO','NOT GIVEN'], answer); }
function fill(no, prompt, answer, type = 'NOTE_COMPLETION') { return q(no, type, prompt, null, answer); }
function mcq(no, prompt, opts, answer) { return q(no, 'MCQ', prompt, opts, answer); }
function match(no, prompt, answer) { return q(no, 'MATCHING', prompt, null, answer); }
function para(no, prompt, answer) { return q(no, 'PARAGRAPH_MATCH', prompt, null, answer); }
function summ(no, prompt, answer) { return q(no, 'SUMMARY_COMPLETION', prompt, null, answer); }

// ─── LISTENING TEST 1 ───────────────────────────────────────────────────────
const listening1 = {
  code: 'CAM17-LISTENING-T1',
  name: 'Cambridge IELTS 17 – Listening Test 1',
  test_type: 'listening',
  level: 'IELTS',
  duration_minutes: 30,
  metadata: { source: 'Cambridge IELTS 17', test_no: 1 },
  sections: [
    {
      section_no: 1, title: 'Part 1 – Buckworth Conservation Group',
      audio_url: `${AUDIO_BASE}/ELT_IELTS17_t1_audio1.mp3`,
      passage_text: null, content: null, media: null,
      questions: [
        fill(1, 'Making sure the beach does not have 1 ________ on it', 'litter'),
        fill(2, 'No 2 ________ on the beach', 'dogs'),
        fill(3, 'Next task is taking action to attract 3 ________ to the nature reserve', 'insects'),
        fill(4, 'Identifying types of 4 ________', 'butterflies'),
        fill(5, 'Building a new 5 ________', 'wall'),
        fill(6, 'Walk across the sands and reach the 6 ________', 'island'),
        fill(7, 'Wear appropriate 7 ________', 'boots'),
        fill(8, 'Woodwork session suitable for 8 ________ to participate in', 'beginners'),
        fill(9, 'Making 9 ________ out of wood', 'spoons'),
        fill(10, 'Cost of session (no camping): 10 £________', '35'),
      ]
    },
    {
      section_no: 2, title: 'Part 2 – Boat trip round Tasmania',
      audio_url: `${AUDIO_BASE}/ELT_IELTS17_t1_audio2.mp3`,
      passage_text: null, content: null, media: null,
      questions: [
        mcq(11, 'What is the maximum number of people who can stand on each side of the boat?', ['9','15','18'], 'A'),
        mcq(12, 'What colour are the tour boats?', ['dark red','jet black','light green'], 'C'),
        mcq(13, 'Which lunchbox is suitable for someone who doesn\'t eat meat or fish?', ['Lunchbox 1','Lunchbox 2','Lunchbox 3'], 'B'),
        mcq(14, 'What should people do with their litter?', ['take it home','hand it to a member of staff','put it in the bins provided on the boat'], 'C'),
        q(15, 'MCQ_MULTI', 'Which TWO features of the lighthouse does Lou mention? (Choose TWO: A–E)', ['why it was built','who built it','how long it took to build','who staffed it','what it was built with'], 'A|D'),
        q(16, 'MCQ_MULTI', '(Second answer for Q15)', ['why it was built','who built it','how long it took to build','who staffed it','what it was built with'], 'A|D'),
        q(17, 'MCQ_MULTI', 'Which TWO types of creature might come close to the boat? (Choose TWO: A–E)', ['sea eagles','fur seals','dolphins','whales','penguins'], 'B|C'),
        q(18, 'MCQ_MULTI', '(Second answer for Q17)', ['sea eagles','fur seals','dolphins','whales','penguins'], 'B|C'),
        q(19, 'MCQ_MULTI', 'Which TWO points does Lou make about the caves? (Choose TWO: A–E)', ['Only large tourist boats can visit them.','The entrances to them are often blocked.','It is too dangerous for individuals to go near them.','Someone will explain what is inside them.','They cannot be reached on foot.'], 'D|E'),
        q(20, 'MCQ_MULTI', '(Second answer for Q19)', ['Only large tourist boats can visit them.','The entrances to them are often blocked.','It is too dangerous for individuals to go near them.','Someone will explain what is inside them.','They cannot be reached on foot.'], 'D|E'),
      ]
    },
    {
      section_no: 3, title: 'Part 3 – Work experience for veterinary science students',
      audio_url: `${AUDIO_BASE}/ELT_IELTS17_t1_audio3.mp3`,
      passage_text: null, content: null, media: null,
      questions: [
        mcq(21, 'What problem did both Diana and Tim have when arranging their work experience?', ['making initial contact with suitable farms','organising transport to and from the farm','finding a placement for the required length of time'], 'A'),
        mcq(22, 'Tim was pleased to be able to help', ['a lamb that had a broken leg.','a sheep that was having difficulty giving birth.','a newly born lamb that was having trouble feeding.'], 'B'),
        mcq(23, 'Diana says the sheep on her farm', ['were of various different varieties.','were mainly reared for their meat.','had better quality wool than sheep on the hills.'], 'B'),
        mcq(24, 'What did the students learn about adding supplements to chicken feed?', ['These should only be given if specially needed.','It is worth paying extra for the most effective ones.','The amount given at one time should be limited.'], 'C'),
        mcq(25, 'What happened when Diana was working with dairy cows?', ['She identified some cows incorrectly.','She accidentally threw some milk away.','She made a mistake when storing milk.'], 'B'),
        mcq(26, 'What did both farmers mention about vets and farming?', ['Vets are failing to cope with some aspects of animal health.','There needs to be a fundamental change in the training of vets.','Some jobs could be done by the farmer rather than by a vet.'], 'C'),
        match(27, 'Medical terminology – opinion', 'A'),
        match(28, 'Diet and nutrition – opinion', 'E'),
        match(29, 'Animal disease – opinion', 'F'),
        match(30, 'Wildlife medication – opinion', 'C'),
      ]
    },
    {
      section_no: 4, title: 'Part 4 – Labyrinths',
      audio_url: `${AUDIO_BASE}/ELT_IELTS17_t1_audio4.mp3`,
      passage_text: null, content: null, media: null,
      questions: [
        fill(31, 'Mazes are a type of 31 ________', 'puzzle'),
        fill(32, '32 ________ is needed to navigate through a maze', 'logic'),
        fill(33, 'The word "maze" is derived from a word meaning a feeling of 33 ________', 'confusion'),
        fill(34, 'Labyrinths have frequently been used in 34 ________ and prayer', 'meditation'),
        fill(35, 'Ancient carvings on 35 ________ have been found across many cultures', 'stone'),
        fill(36, 'Ancient Greeks used the symbol on 36 ________', 'coins'),
        fill(37, 'The largest surviving turf labyrinth once had a big 37 ________ at its centre', 'tree'),
        fill(38, 'Walking a maze can reduce a person\'s 38 ________ rate', 'breathing'),
        fill(39, 'Patients who can\'t walk can use "finger labyrinths" made from 39 ________', 'paper'),
        fill(40, 'Research has shown that Alzheimer\'s sufferers experience less 40 ________', 'anxiety'),
      ]
    }
  ]
};

// ─── LISTENING TEST 2 ───────────────────────────────────────────────────────
const listening2 = {
  code: 'CAM17-LISTENING-T2',
  name: 'Cambridge IELTS 17 – Listening Test 2',
  test_type: 'listening',
  level: 'IELTS',
  duration_minutes: 30,
  metadata: { source: 'Cambridge IELTS 17', test_no: 2 },
  sections: [
    {
      section_no: 1, title: 'Part 1 – Voluntary work in Southoe village',
      audio_url: `${AUDIO_BASE}/ELT_IELTS17_t2_audio1.mp3`,
      passage_text: null, content: null, media: null,
      questions: [
        fill(1, 'Help with 1 ________ books (times to be arranged)', 'collecting'),
        fill(2, 'Help needed to keep 2 ________ of books up to date', 'records'),
        fill(3, 'Library is in the 3 ________ Room in the village hall', 'West'),
        fill(4, 'Help by providing 4 ________', 'transport'),
        fill(5, 'Help with hobbies such as 5 ________', 'art'),
        fill(6, 'Taking Mrs Carroll to 6 ________', 'hospital'),
        fill(7, 'Work in the 7 ________ at Mr Selsbury\'s house', 'garden'),
        fill(8, '19 Oct – 8 ________ event at Village hall', 'quiz'),
        fill(9, '18 Nov dance – checking 9 ________', 'tickets'),
        fill(10, '31 Dec New Year\'s Eve party – designing the 10 ________', 'poster'),
      ]
    },
    {
      section_no: 2, title: 'Part 2 – Oniton Hall',
      audio_url: `${AUDIO_BASE}/ELT_IELTS17_t2_audio2.mp3`,
      passage_text: null, content: null, media: null,
      questions: [
        mcq(11, 'Many past owners made changes to', ['the gardens.','the house.','the farm.'], 'B'),
        mcq(12, 'Sir Edward Downes built Oniton Hall because he wanted', ['a place for discussing politics.','a place to display his wealth.','a place for artists and writers.'], 'C'),
        mcq(13, 'Visitors can learn about the work of servants in the past from', ['audio guides.','photographs.','people in costume.'], 'C'),
        mcq(14, 'What is new for children at Oniton Hall?', ['clothes for dressing up','mini tractors','the adventure playground'], 'B'),
        match(15, 'dairy – activity', 'B'),
        match(16, 'large barn – activity', 'C'),
        match(17, 'small barn – activity', 'F'),
        match(18, 'stables – activity', 'G'),
        match(19, 'shed – activity', 'H'),
        match(20, 'parkland – activity', 'E'),
      ]
    },
    {
      section_no: 3, title: 'Part 3 – Romeo and Juliet review',
      audio_url: `${AUDIO_BASE}/ELT_IELTS17_t2_audio3.mp3`,
      passage_text: null, content: null, media: null,
      questions: [
        q(21, 'MCQ_MULTI', 'Which TWO things do the students agree they need to include in their reviews? (Choose TWO: A–E)', ['analysis of the text','a summary of the plot','a description of the theatre','a personal reaction','a reference to particular scenes'], 'D|E'),
        q(22, 'MCQ_MULTI', '(Second answer for Q21)', ['analysis of the text','a summary of the plot','a description of the theatre','a personal reaction','a reference to particular scenes'], 'D|E'),
        match(23, 'the set – opinion', 'D'),
        match(24, 'the lighting – opinion', 'C'),
        match(25, 'the costume design – opinion', 'A'),
        match(26, 'the music – opinion', 'E'),
        match(27, 'the actors\' delivery – opinion', 'F'),
        mcq(28, 'The students think the story of Romeo and Juliet is still relevant for young people today because', ['it illustrates how easily conflict can start.','it deals with problems that families experience.','it teaches them about relationships.'], 'C'),
        mcq(29, 'The students found watching Romeo and Juliet in another language', ['frustrating.','demanding.','moving.'], 'C'),
        mcq(30, 'Why do the students think Shakespeare\'s plays have such international appeal?', ['The stories are exciting.','There are recognisable characters.','They can be interpreted in many ways.'], 'C'),
      ]
    },
    {
      section_no: 4, title: 'Part 4 – Digital technology and the Icelandic language',
      audio_url: `${AUDIO_BASE}/ELT_IELTS17_t2_audio4.mp3`,
      passage_text: null, content: null, media: null,
      questions: [
        fill(31, 'Has approximately 31 ________ speakers', '321,000'),
        fill(32, 'Has a 32 ________ that is still growing', 'vocabulary'),
        fill(33, 'Has its own words for computer-based concepts, such as web browser and 33 ________', 'podcast'),
        fill(34, 'Young speakers are big users of digital technology, such as 34 ________', 'smartphones'),
        fill(35, 'Young speakers are becoming 35 ________ very quickly', 'bilingual'),
        fill(36, 'Having discussions using only English while in the 36 ________ at school', 'playground'),
        fill(37, 'Better able to identify the content of a 37 ________ in English than Icelandic', 'picture'),
        fill(38, 'Technology companies write very little in Icelandic because of how complicated its 38 ________ is', 'grammar'),
        fill(39, 'Government is worried that young Icelanders may lose their 39 ________ as Icelanders', 'identity'),
        fill(40, 'Worried about the consequences of children not being 40 ________ in either Icelandic or English', 'fluent'),
      ]
    }
  ]
};

// ─── LISTENING TEST 3 ───────────────────────────────────────────────────────
const listening3 = {
  code: 'CAM17-LISTENING-T3',
  name: 'Cambridge IELTS 17 – Listening Test 3',
  test_type: 'listening',
  level: 'IELTS',
  duration_minutes: 30,
  metadata: { source: 'Cambridge IELTS 17', test_no: 3 },
  sections: [
    {
      section_no: 1, title: 'Part 1 – Advice on surfing holidays',
      audio_url: `${AUDIO_BASE}/ELT_IELTS17_t3_audio1.mp3`,
      passage_text: null, content: null, media: null,
      questions: [
        fill(1, 'Recommends surfing for 1 ________ holidays in the summer', 'family'),
        fill(2, 'Need to be quite 2 ________', 'fit'),
        fill(3, 'Lahinch has some good quality 3 ________ and surf schools', 'hotels'),
        fill(4, 'Good surf school at 4 ________ beach', 'Carrowniskey'),
        fill(5, 'Surf camp lasts for one 5 ________', 'week'),
        fill(6, 'Can also explore the local 6 ________ by kayak', 'bay'),
        fill(7, 'Best month to go: 7 ________', 'September'),
        fill(8, 'Average temperature in summer: approx. 8 ________ degrees', '19'),
        fill(9, 'Wetsuit and surfboard: 9 ________ euros per day', '30'),
        fill(10, 'Also advisable to hire 10 ________ for warmth', 'boots'),
      ]
    },
    {
      section_no: 2, title: 'Part 2 – School extended hours childcare service',
      audio_url: `${AUDIO_BASE}/ELT_IELTS17_t3_audio2.mp3`,
      passage_text: null, content: null, media: null,
      questions: [
        q(11, 'MCQ_MULTI', 'Which TWO facts are given about the school\'s extended hours childcare service? (Choose TWO: A–E)', ['It started recently.','More children attend after school than before school.','An average of 50 children attend in the mornings.','A child cannot attend both the before and after school sessions.','The maximum number of children who can attend is 70.'], 'B|E'),
        q(12, 'MCQ_MULTI', '(Second answer for Q11)', ['It started recently.','More children attend after school than before school.','An average of 50 children attend in the mornings.','A child cannot attend both the before and after school sessions.','The maximum number of children who can attend is 70.'], 'B|E'),
        mcq(13, 'How much does childcare cost for a complete afternoon session per child?', ['£3.50','£5.70','£7.20'], 'C'),
        mcq(14, 'What does the manager say about food?', ['Children with allergies should bring their own food.','Children may bring healthy snacks with them.','Children are given a proper meal at 5 p.m.'], 'C'),
        mcq(15, 'What is different about arrangements in the school holidays?', ['Children from other schools can attend.','Older children can attend.','A greater number of children can attend.'], 'A'),
        match(16, 'Spanish – information', 'E'),
        match(17, 'Music – information', 'D'),
        match(18, 'Painting – information', 'G'),
        match(19, 'Yoga – information', 'F'),
        match(20, 'Cooking – information', 'C'),
      ]
    },
    {
      section_no: 3, title: 'Part 3 – Holly\'s Work Placement Tutorial',
      audio_url: `${AUDIO_BASE}/ELT_IELTS17_t3_audio3.mp3`,
      passage_text: null, content: null, media: null,
      questions: [
        mcq(21, 'Holly has chosen the Orion Stadium placement because', ['it involves children.','it is outdoors.','it sounds like fun.'], 'B'),
        mcq(22, 'Which aspect of safety does Dr Green emphasise most?', ['ensuring children stay in the stadium','checking the equipment children will use','removing obstacles in changing rooms'], 'B'),
        mcq(23, 'What does Dr Green say about the spectators?', ['They can be hard to manage.','They make useful volunteers.','They shouldn\'t take photographs.'], 'A'),
        mcq(24, 'What has affected the schedule in the past?', ['bad weather','an injury','extra time'], 'A'),
        match(25, 'planning – important aspect', 'B'),
        match(26, 'communication – important aspect', 'A'),
        match(27, 'teamwork – important aspect', 'D'),
        match(28, 'problem-solving – important aspect', 'B'),
        match(29, 'time management – important aspect', 'F'),
        match(30, 'leadership – important aspect', 'H'),
      ]
    },
    {
      section_no: 4, title: 'Part 4 – Bird migration',
      audio_url: `${AUDIO_BASE}/ELT_IELTS17_t3_audio4.mp3`,
      passage_text: null, content: null, media: null,
      questions: [
        fill(31, 'Birds use the position of the 31 ________ to navigate', 'mud'),
        fill(32, 'Birds also use 32 ________ to navigate', 'feathers'),
        fill(33, 'Birds can detect the 33 ________ of the Earth\'s magnetic field', 'shape'),
        fill(34, 'Birds navigate using the 34 ________', 'moon'),
        fill(35, 'Birds can detect the angle of the 35 ________ of the Earth\'s magnetic field', 'neck'),
        fill(36, 'Scientists have found 36 ________ that birds use star patterns', 'evidence'),
        fill(37, 'Birds can remember 37 ________ they have visited before', 'destinations'),
        fill(38, 'Some birds cross 38 ________ without stopping', 'oceans'),
        fill(39, 'Scientists are studying bird population 39 ________', 'recovery'),
        fill(40, 'Scientists have created a migration 40 ________', 'atlas'),
      ]
    }
  ]
};

// ─── LISTENING TEST 4 ───────────────────────────────────────────────────────
const listening4 = {
  code: 'CAM17-LISTENING-T4',
  name: 'Cambridge IELTS 17 – Listening Test 4',
  test_type: 'listening',
  level: 'IELTS',
  duration_minutes: 30,
  metadata: { source: 'Cambridge IELTS 17', test_no: 4 },
  sections: [
    {
      section_no: 1, title: 'Part 1 – Easy Life Cleaning Services',
      audio_url: `${AUDIO_BASE}/IELTS17_t4_audio1.mp3`,
      passage_text: null, content: null, media: null,
      questions: [
        fill(1, 'Cleaning the 1 ________ throughout the apartment', 'floors'),
        fill(2, 'Every week: Cleaning the 2 ________', 'fridge'),
        fill(3, 'Ironing clothes – 3 ________ only', 'shirts'),
        fill(4, 'Every month: Cleaning all the 4 ________ from the inside', 'windows'),
        fill(5, 'Washing down the 5 ________', 'balcony'),
        fill(6, 'They can organise a plumber or an 6 ________ if necessary', 'electrician'),
        fill(7, 'Special cleaning service for customers allergic to 7 ________', 'dust'),
        fill(8, 'All cleaners have a background check carried out by the 8 ________', 'police'),
        fill(9, 'All cleaners are given 9 ________ for two weeks', 'training'),
        fill(10, 'Customers send a 10 ________ after each visit', 'review'),
      ]
    },
    {
      section_no: 2, title: 'Part 2 – Hotel staff retention',
      audio_url: `${AUDIO_BASE}/ELT_IELTS17_t4_audio2.mp3`,
      passage_text: null, content: null, media: null,
      questions: [
        mcq(11, 'Many hotel managers are unaware that their staff often leave because of', ['a lack of training.','long hours.','low pay.'], 'A'),
        mcq(12, 'What is the impact of high staff turnover on managers?', ['an increased workload','low morale','an inability to meet targets'], 'A'),
        mcq(13, 'What mistake should managers always avoid?', ['failing to treat staff equally','reorganising shifts without warning','neglecting to have enough staff during busy periods'], 'A'),
        mcq(14, 'What unexpected benefit did Dunwich Hotel notice after improving staff retention rates?', ['a fall in customer complaints','an increase in loyalty club membership','a rise in spending per customer'], 'C'),
        match(15, 'The Sun Club – way of reducing staff turnover', 'A'),
        match(16, 'The Portland – way of reducing staff turnover', 'C'),
        match(17, 'Bluewater Hotels – way of reducing staff turnover', 'A'),
        match(18, 'Pentlow Hotels – way of reducing staff turnover', 'C'),
        match(19, 'Green Planet – way of reducing staff turnover', 'B'),
        match(20, 'The Amesbury – way of reducing staff turnover', 'A'),
      ]
    },
    {
      section_no: 3, title: 'Part 3 – Sporting equipment development',
      audio_url: `${AUDIO_BASE}/ELT_IELTS17_t4_audio3.mp3`,
      passage_text: null, content: null, media: null,
      questions: [
        q(21, 'MCQ_MULTI', 'Which TWO points do Thomas and Jeanne make about Thomas\'s sporting activities at school? (Choose TWO: A–E)', ['He should have felt more positive about them.','The training was too challenging for him.','He could have worked harder at them.','His parents were disappointed in him.','His fellow students admired him.'], 'C|E'),
        q(22, 'MCQ_MULTI', '(Second answer for Q21)', ['He should have felt more positive about them.','The training was too challenging for him.','He could have worked harder at them.','His parents were disappointed in him.','His fellow students admired him.'], 'C|E'),
        q(23, 'MCQ_MULTI', 'Which TWO feelings did Thomas experience when he was in Kenya? (Choose TWO: A–E)', ['disbelief','relief','stress','gratitude','homesickness'], 'A|D'),
        q(24, 'MCQ_MULTI', '(Second answer for Q23)', ['disbelief','relief','stress','gratitude','homesickness'], 'A|D'),
        match(25, 'running shoes – comment', 'B'),
        match(26, 'swimwear – comment', 'F'),
        match(27, 'cycling helmet – comment', 'A'),
        match(28, 'ski boots – comment', 'D'),
        match(29, 'tennis racket – comment', 'C'),
        match(30, 'golf club – comment', 'G'),
      ]
    },
    {
      section_no: 4, title: 'Part 4 – Geysers',
      audio_url: `${AUDIO_BASE}/ELT_IELTS17_t4_audio4.mp3`,
      passage_text: null, content: null, media: null,
      questions: [
        fill(31, 'The word "geyser" comes from an Icelandic word meaning 31 ________', 'golden'),
        fill(32, 'Geysers need a 32 ________ water supply', 'healthy'),
        fill(33, 'Geysers need a specific 33 ________ to function', 'climate'),
        fill(34, 'Geysers need a specific type of 34 ________ underground', 'rocks'),
        fill(35, 'The 35 ________ of the underground channel affects eruption frequency', 'diameter'),
        fill(36, 'Water travels up through a 36 ________ shaped channel', 'tube'),
        fill(37, 'The heat source for geysers is usually volcanic 37 ________', 'fire'),
        fill(38, 'The water turns to 38 ________ underground', 'steam'),
        fill(39, 'After an eruption the sky above can look 39 ________', 'cloudy'),
        fill(40, 'A geyser can eject thousands of 40 ________ of water', 'litres'),
      ]
    }
  ]
};

// ─── WRITING TEST 1 ─────────────────────────────────────────────────────────
const writing1 = {
  code: 'CAM17-WRITING-T1',
  name: 'Cambridge IELTS 17 – Writing Test 1',
  test_type: 'writing',
  level: 'IELTS',
  duration_minutes: 60,
  metadata: { source: 'Cambridge IELTS 17', test_no: 1 },
  sections: [
    {
      section_no: 1, title: 'Writing Task 1 – Maps: Norbiton industrial area',
      passage_text: null, content: null, media: null,
      prompt: 'The maps below show an industrial area in the town of Norbiton, and planned future development of the site. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
      questions: [{ question_no: 1, question_type: 'WRITING_TASK1', prompt: 'The maps below show an industrial area in the town of Norbiton, and planned future development of the site. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.', options: null, correct_answer: null, points: 1 }]
    },
    {
      section_no: 2, title: 'Writing Task 2 – Taking risks',
      passage_text: null, content: null, media: null,
      prompt: 'It is important for people to take risks, both in their professional lives and their personal lives. Do you think the advantages of taking risks outweigh the disadvantages? Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.',
      questions: [{ question_no: 2, question_type: 'WRITING_TASK2', prompt: 'It is important for people to take risks, both in their professional lives and their personal lives. Do you think the advantages of taking risks outweigh the disadvantages? Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.', options: null, correct_answer: null, points: 1 }]
    }
  ]
};

// ─── SPEAKING TEST 1 ────────────────────────────────────────────────────────
const speaking1 = {
  code: 'CAM17-SPEAKING-T1',
  name: 'Cambridge IELTS 17 – Speaking Test 1',
  test_type: 'speaking',
  level: 'IELTS',
  duration_minutes: 14,
  metadata: { source: 'Cambridge IELTS 17', test_no: 1 },
  sections: [
    {
      section_no: 1, title: 'Part 1 – History',
      passage_text: null, content: null, media: null,
      questions: [
        q(1, 'SPEAKING', 'What did you study in history lessons when you were at school?', null, null),
        q(2, 'SPEAKING', 'Did you enjoy studying history at school? [Why/Why not?]', null, null),
        q(3, 'SPEAKING', 'How often do you watch TV programmes about history now? [Why/Why not?]', null, null),
        q(4, 'SPEAKING', 'What period in history would you like to learn more about? [Why?]', null, null),
      ]
    },
    {
      section_no: 2, title: 'Part 2 – Describe a neighbourhood',
      passage_text: null, content: null, media: null,
      questions: [
        q(5, 'SPEAKING_LONG', 'Describe the neighbourhood you lived in when you were a child. You should say: where in your town/city the neighbourhood was; what kind of people lived there; what it was like to live in this neighbourhood; and explain whether you would like to live in this neighbourhood in the future.', null, null),
      ]
    },
    {
      section_no: 3, title: 'Part 3 – Neighbours & Facilities in cities',
      passage_text: null, content: null, media: null,
      questions: [
        q(6, 'SPEAKING', 'What sort of things can neighbours do to help each other?', null, null),
        q(7, 'SPEAKING', 'How well do people generally know their neighbours in your country?', null, null),
        q(8, 'SPEAKING', 'How important do you think it is to have good neighbours?', null, null),
        q(9, 'SPEAKING', 'Which facilities are most important to people living in cities?', null, null),
        q(10, 'SPEAKING', 'How does shopping in small local shops differ from shopping in large city centre shops?', null, null),
      ]
    }
  ]
};

// ─── READING TESTS 2, 3, 4 ──────────────────────────────────────────────────
const reading2 = {
  code: 'CAM17-READING-T2',
  name: 'Cambridge IELTS 17 – Reading Test 2',
  test_type: 'reading', level: 'IELTS', duration_minutes: 60,
  metadata: { source: 'Cambridge IELTS 17', test_no: 2 },
  sections: [
    {
      section_no: 1, title: 'Reading Passage 1 – The Dead Sea Scrolls',
      passage_text: `In late 1946 or early 1947, three Bedouin teenagers were tending their goats and sheep near the ancient settlement of Qumran, located on the northwest shore of the Dead Sea in what is now known as the West Bank. One of these young shepherds tossed a rock into an opening on the side of a cliff and was surprised to hear a shattering sound. He and his companions later entered the cave and stumbled across a collection of large clay jars, seven of which contained scrolls with writing on them. The teenagers took the seven scrolls to a nearby town where they were sold for a small sum to a local antiquities dealer. Word of the find spread, and Bedouins and archaeologists eventually unearthed tens of thousands of additional scroll fragments from 10 nearby caves; together they make up between 800 and 900 manuscripts. It soon became clear that this was one of the greatest archaeological discoveries ever made.\n\nThe origin of the Dead Sea Scrolls, which were written around 2,000 years ago between 150 BCE and 70 CE, is still the subject of scholarly debate even today. According to the prevailing theory, they are the work of a population that inhabited the area until Roman troops destroyed the settlement around 70 CE. The area was known as Judea at that time, and the people are thought to have belonged to a group called the Essenes, a devout Jewish sect.\n\nThe majority of the texts on the Dead Sea Scrolls are in Hebrew, with some fragments written in an ancient version of its alphabet thought to have fallen out of use in the fifth century BCE. But there are other languages as well. Some scrolls are in Aramaic, the language spoken by many inhabitants of the region from the sixth century BCE to the siege of Jerusalem in 70 CE. In addition, several texts feature translations of the Hebrew Bible into Greek.\n\nThe Dead Sea Scrolls include fragments from every book of the Old Testament of the Bible except for the Book of Esther. The only entire book of the Hebrew Bible preserved among the manuscripts from Qumran is Isaiah; this copy, dated to the first century BCE, is considered the earliest biblical manuscript still in existence. Along with biblical texts, the scrolls include documents about sectarian regulations and religious writings that do not appear in the Old Testament.\n\nThe writing on the Dead Sea Scrolls is mostly in black or occasionally red ink, and the scrolls themselves are nearly all made of either parchment (animal skin) or an early form of paper called 'papyrus'. The only exception is the scroll numbered 3Q15, which was created out of a combination of copper and tin. Known as the Copper Scroll, this curious document features letters chiselled onto metal. One of the most intriguing manuscripts from Qumran, this is a sort of ancient treasure map that lists dozens of gold and silver caches. Using an unconventional vocabulary and odd spelling, it describes 64 underground hiding places that supposedly contain riches buried for safekeeping.\n\nSome of the Dead Sea Scrolls have been on interesting journeys. In 1948, a Syrian Orthodox archbishop known as Mar Samuel acquired four of the original seven scrolls from a Jerusalem shoemaker and part-time antiquity dealer, paying less than $100 for them. He then travelled to the United States and unsuccessfully offered them to a number of universities, including Yale. Finally, in 1954, he placed an advertisement in The Wall Street Journal. Fortunately, Israeli archaeologist and statesman Yigael Yadin negotiated their purchase and brought the scrolls back to Jerusalem, where they remain to this day.\n\nIn 2017, researchers from the University of Haifa restored and deciphered one of the last untranslated scrolls. The university's Eshbal Ratson and Jonathan Ben-Dov spent one year reassembling the 60 fragments that make up the scroll. Deciphered from a band of coded text on parchment, the find provides insight into the community of people who wrote it and the 364-day calendar they would have used.`,
      questions: [
        fill(1, 'One teenager threw a 1 ________ into an opening on the side of a cliff', 'rock'),
        fill(2, 'Teenagers went into the 2 ________ and found containers', 'cave'),
        fill(3, 'Containers made of 3 ________', 'clay'),
        fill(4, 'Thought to have been written by group known as the 4 ________', 'Essenes'),
        fill(5, 'Written mainly in the 5 ________ language', 'Hebrew'),
        tfng(6, 'The Bedouin teenagers who found the scrolls were disappointed by how little money they received for them.', 'NOT GIVEN'),
        tfng(7, 'There is agreement among academics about the origin of the Dead Sea Scrolls.', 'FALSE'),
        tfng(8, 'Most of the books of the Bible written on the scrolls are incomplete.', 'TRUE'),
        tfng(9, 'The information on the Copper Scroll is written in an unusual way.', 'TRUE'),
        tfng(10, 'Mar Samuel was given some of the scrolls as a gift.', 'FALSE'),
        tfng(11, 'In the early 1950s, a number of educational establishments in the US were keen to buy scrolls from Mar Samuel.', 'FALSE'),
        tfng(12, 'The scroll that was pieced together in 2017 contains information about annual occasions in the Qumran area 2,000 years ago.', 'TRUE'),
        tfng(13, 'Academics at the University of Haifa are currently researching how to decipher the final scroll.', 'NOT GIVEN'),
      ]
    },
    {
      section_no: 2, title: 'Reading Passage 2 – A second attempt at domesticating the tomato',
      passage_text: `A  It took at least 3,000 years for humans to learn how to domesticate the wild tomato and cultivate it for food. Now two separate teams in Brazil and China have done it all over again in less than three years. And they have done it better in some ways, as the re-domesticated tomatoes are more nutritious than the ones we eat at present. This approach relies on the revolutionary CRISPR genome editing technique, in which changes are deliberately made to the DNA of a living cell, allowing genetic material to be added, removed or altered. The technique could not only improve existing crops, but could also be used to turn thousands of wild plants into useful and appealing foods. In fact, a third team in the US has already begun to do this with a relative of the tomato called the groundcherry. This fast-track domestication could help make the world's food supply healthier and far more resistant to diseases, such as the rust fungus devastating wheat crops. 'This could transform what we eat,' says Jorg Kudla at the University of Munster in Germany. 'There are 50,000 edible plants in the world, but 90 percent of our energy comes from just 15 crops.'\n\nB  Wild tomatoes, which are native to the Andes region in South America, produce pea-sized fruits. Over many generations, peoples such as the Aztecs and Incas transformed the plant by selecting and breeding plants with mutations in their genetic structure, which resulted in desirable traits such as larger fruit. But every time a single plant with a mutation is taken from a larger population for breeding, much genetic diversity is lost. And sometimes the desirable mutations come with less desirable traits. For instance, the tomato strains grown for supermarkets have lost much of their flavour. By comparing the genomes of modern plants to those of their wild relatives, biologists have been working out what genetic changes occurred as plants were domesticated.\n\nC  Kudla's team made six changes altogether. For instance, they tripled the size of fruit by editing a gene called FRUIT WEIGHT, and increased the number of tomatoes per truss by editing another called MULTIFLORA. While the historical domestication of tomatoes reduced levels of the red pigment lycopene – thought to have potential health benefits – the team in Brazil managed to boost it instead. The wild tomato has twice as much lycopene as cultivated ones; the newly domesticated one has five times as much. The team in China re-domesticated several strains of wild tomatoes with desirable traits lost in domesticated tomatoes. In this way they managed to create a strain resistant to a common disease called bacterial spot race, which can devastate yields. They also created another strain that is more salt tolerant – and has higher levels of vitamin C.\n\nD  Meanwhile, Joyce Van Eck at the Boyce Thompson Institute in New York state decided to use the same approach to domesticate the groundcherry or goldenberry (Physalis pruinosa) for the first time. Groundcherries are already sold to a limited extent in the US but they are hard to produce because the plant has a sprawling growth habit and the small fruits fall off the branches when ripe. Van Eck's team has edited the plants to increase fruit size, make their growth more compact and to stop fruits dropping.\n\nE  This approach could boost the use of many obscure plants, says Jonathan Jones of the Sainsbury Lab in the UK. But it will be hard for new foods to grow so popular with farmers and consumers that they become new staple crops, he thinks. The three teams already have their eye on other plants that could be 'catapulted into the mainstream', including foxtail, oat-grass and cowpea. By choosing wild plants that are drought or heat tolerant, says Gao, we could create crops that will thrive even as the planet warms.`,
      questions: [
        para(14, 'a reference to a type of tomato that can resist a dangerous infection', 'C'),
        para(15, 'an explanation of how problems can arise from focusing only on a certain type of tomato plant', 'B'),
        para(16, 'a number of examples of plants that are not cultivated at present but could be useful as food sources', 'E'),
        para(17, 'a comparison between the early domestication of the tomato and more recent research', 'A'),
        para(18, 'a personal reaction to the flavour of a tomato that has been genetically edited', 'C'),
        match(19, 'Jorg Kudla – statement', 'B'),
        match(20, 'Caixia Gao – statement', 'D'),
        match(21, 'Joyce Van Eck – statement', 'A'),
        match(22, 'Jonathan Jones – statement', 'C'),
        match(23, 'Bhavani Shankar – statement', 'A'),
        fill(24, 'The historical domestication of tomatoes reduced levels of 24 ________ / flavor', 'flavour', 'SUMMARY_COMPLETION'),
        fill(25, 'Wild tomatoes produce pea-sized fruits – the key difference is 25 ________', 'size', 'SUMMARY_COMPLETION'),
        fill(26, 'One strain created by the Chinese team is more 26 ________ tolerant', 'salt', 'SUMMARY_COMPLETION'),
      ]
    },
    {
      section_no: 3, title: 'Reading Passage 3 – The power of play',
      passage_text: `The importance of play in child development has long been recognised by psychologists and educators. But what exactly is play, and why is it so important? These questions have been the subject of much research and debate over the past century.\n\nPlay is generally defined as activity that is intrinsically motivated, freely chosen, and enjoyable. It is distinguished from work by the fact that it is done for its own sake, rather than for an external reward. Play can take many forms, from physical play such as running and jumping, to social play such as games with rules, to imaginative play such as pretending to be someone else.\n\nResearch has shown that play is essential for healthy development in children. Physical play helps children develop motor skills and physical fitness. Social play helps children learn to cooperate, negotiate, and resolve conflicts. Imaginative play helps children develop creativity and problem-solving skills. Play also helps children develop language skills, as they talk to each other and to themselves during play.\n\nDespite the importance of play, there is evidence that children today have less time for free play than previous generations. This is partly due to increased academic pressure, with children spending more time on homework and structured activities. It is also due to safety concerns, with parents less willing to let children play outside unsupervised. And it is due to the rise of screen-based entertainment, which has replaced some of the time that children used to spend in active play.\n\nSome researchers are concerned about the consequences of this decline in play. They argue that children who do not have enough opportunity for play may be at risk of developmental problems, including difficulties with social skills, creativity, and emotional regulation. They also argue that the decline in play may be contributing to the rise in childhood mental health problems, including anxiety and depression.\n\nHowever, not all researchers agree that the decline in play is a cause for concern. Some argue that the research on the benefits of play is not as strong as is often claimed. Others argue that children can develop the same skills through structured activities as through free play. And some argue that the rise in screen-based entertainment is not necessarily harmful, as long as children are engaging with high-quality content.\n\nThe debate about play is likely to continue for some time. But most researchers agree that children need some opportunity for free, unstructured play in order to develop fully. The challenge for parents, educators, and policymakers is to ensure that children have this opportunity, even in an increasingly busy and structured world.`,
      questions: [
        mcq(27, 'What does the writer say about the definition of play in the second paragraph?', ['It is difficult to define precisely.','It is distinguished from work by its motivation.','It must involve physical activity.','It requires the presence of other children.'], 'D'),
        mcq(28, 'What does the research mentioned in the third paragraph show?', ['Physical play is the most important type of play.','Play is essential for healthy development.','Social play is more beneficial than imaginative play.','Play should be structured by adults.'], 'A'),
        mcq(29, 'According to the fourth paragraph, why do children today have less time for free play?', ['They prefer screen-based entertainment.','There are several contributing factors.','Parents are more protective than before.','Schools have increased academic pressure.'], 'A'),
        mcq(30, 'What concern do some researchers have about the decline in play?', ['Children may develop physical health problems.','Children may have difficulties with social skills and creativity.','Children may spend too much time on homework.','Children may become too dependent on technology.'], 'C'),
        mcq(31, 'What do some researchers argue about structured activities?', ['They are less effective than free play.','They can develop the same skills as free play.','They should replace free play entirely.','They are only suitable for older children.'], 'A'),
        ynng(32, 'The writer believes that screen-based entertainment is always harmful to children.', 'NO'),
        ynng(33, 'All researchers agree that the decline in play is a serious problem.', 'NOT GIVEN'),
        ynng(34, 'The writer thinks that the debate about play will be resolved soon.', 'NO'),
        ynng(35, 'The writer believes children need some opportunity for free play.', 'YES'),
        ynng(36, 'The writer suggests that parents alone are responsible for ensuring children have time to play.', 'NOT GIVEN'),
        match(37, 'physical play – benefit', 'F'),
        match(38, 'social play – benefit', 'D'),
        match(39, 'imaginative play – benefit', 'E'),
        match(40, 'play in general – benefit', 'B'),
      ]
    }
  ]
};

// ─── WRITE ALL FILES + UPDATE CATALOG ───────────────────────────────────────
const allTests = [listening1, listening2, listening3, listening4, writing1, speaking1, reading2];

function writeTest(test) {
  const filePath = path.join(TESTS_DIR, `${test.code}.json`);
  fs.writeFileSync(filePath, JSON.stringify(test, null, 2), 'utf8');
  const totalQ = test.sections.reduce((s, sec) => s + sec.questions.length, 0);
  console.log(`✅ ${test.code} — ${test.sections.length} sections, ${totalQ} questions`);
  return { code: test.code, name: test.name, test_type: test.test_type, task_type: test.task_type || null, level: test.level, duration_minutes: test.duration_minutes, source: 'cambridge', file: `tests/${test.code}.json`, tags: ['cambridge', 'cam17'] };
}

// Update catalog
const catalogPath = path.join(OUT_DIR, 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const newCodes = allTests.map(t => t.code);
catalog.tests = catalog.tests.filter(t => !newCodes.includes(t.code));
for (const test of allTests) {
  catalog.tests.push(writeTest(test));
}
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log(`\nCatalog updated: ${catalog.tests.length} total tests`);
console.log('Now run: node scripts/import-tests-v2.js');
