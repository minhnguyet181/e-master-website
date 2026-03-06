import React, { useState } from 'react';
import './Resource.css';
import ipaImage from '../../images copy/IPA.webp';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

// --- ICONS ---
const ChevronDownIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`icon icon-chevron ${className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);
const PencilIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`icon icon-sky ${className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);
const SoundWaveIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`icon icon-amber ${className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.353-.026.715-.026 1.068 0 1.13.094 1.976 1.057 1.976 2.192v1.392M8.25 12.75h7.5m-7.5 3H12M10.5 21.75H13.5a2.25 2.25 0 0 0 2.25-2.25V15a2.25 2.25 0 0 0-2.25-2.25H10.5A2.25 2.25 0 0 0 8.25 15v4.5A2.25 2.25 0 0 0 10.5 21.75Z" />
  </svg>
);
const BookOpenIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`icon icon-rose ${className || ''}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6-2.292m0 0V21" />
    </svg>
);
const ArrowLeftIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`icon icon-back ${className || ''}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
);

// --- CONSTANTS ---
const PRACTICE_LINKS = [
  { text: 'Practice IELTS Reading with detailed answer explanations', href: '#' },
  { text: 'Practice IELTS Listening with detailed answer explanations', href: '#' },
  { text: 'Self-study speaking section for course 56 students', href: '#' },
  { text: 'Self-study writing section for course 56 students', href: '#' },
];

const GRAMMAR_ARTICLES = [
  {
    id: 1,
    title: 'Basic sentence components: Subject & Predicate, 4 basic sentence types',
    content: (
      <div className="article-content">
        <h2>Basic Components: Subject and Predicate</h2>
        <p>
          Every complete English sentence has two core parts: the <strong>subject</strong> (who or what the sentence is about) and the <strong>predicate</strong> (what is said about the subject — usually contains the verb).
        </p>
        <h3>Simple examples</h3>
        <div className="code-block"><p><strong>She</strong> <em>reads</em> a book.</p></div>
        <div className="code-block"><p><strong>The students</strong> <em>are studying</em> grammar.</p></div>

        <h3>Four basic sentence types</h3>
        <ol>
          <li><strong>Declarative</strong> — makes a statement. (Ex: "I like coffee.")</li>
          <li><strong>Interrogative</strong> — asks a question. (Ex: "Do you like coffee?")</li>
          <li><strong>Imperative</strong> — gives a command or request. (Ex: "Please open the window.")</li>
          <li><strong>Exclamatory</strong> — expresses strong feeling. (Ex: "What a lovely song!")</li>
        </ol>

        <h3>Common mistakes</h3>
        <p>
          - Missing verb: "She a book." (incorrect) → needs predicate verb: "She <em>reads</em> a book."<br />
          - Sentence fragments: ensure both subject and predicate are present for full statements.
        </p>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Verb types & sentence structures: action, stative, auxiliary, modal',
    content: (
      <div className="article-content">
        <h2>Main verb categories</h2>
        <p>
          Verbs show actions or states. The most important categories you should know are:
        </p>
        <ul>
          <li><strong>Action verbs</strong>: express physical or mental actions. (Ex: walk, write, think)</li>
          <li><strong>Stative verbs</strong>: express states or conditions (like, love, know, belong). These are usually not used in continuous tenses.</li>
          <li><strong>Auxiliary verbs</strong>: be, have, do — used to form tenses, passives, and questions.</li>
          <li><strong>Modal verbs</strong>: can, could, may, might, will, would, shall, should, must — express ability, possibility, permission, obligation.</li>
        </ul>

        <h3>Common sentence patterns</h3>
        <p>
          English sentences often follow predictable patterns (S = subject, V = verb, O = object, C = complement):
        </p>
        <ol>
          <li><strong>S + V</strong> — e.g., "Birds fly."</li>
          <li><strong>S + V + O</strong> — e.g., "She reads books."</li>
          <li><strong>S + V + C</strong> — e.g., "He is a teacher." (C is a noun or adjective describing the subject)</li>
          <li><strong>S + V + O + O</strong> — e.g., "I gave him a pen." (two objects)</li>
        </ol>

        <h3>Tip</h3>
        <p>
          Identify the verb first to find the predicate, then look left for the subject and right for objects or complements.
        </p>
      </div>
    ),
  },
  {
    id: 3,
    title: 'Linking verbs vs action verbs (copular verbs)',
    content: (
      <div className="article-content">
        <h2>What are linking (copular) verbs?</h2>
        <p>
          Linking verbs connect the subject to information that describes or identifies it. The most common linking verb is <em>be</em> (am/is/are/was/were). Other verbs can act as linkers when they describe a state: <em>seem, appear, become, feel, look, taste</em>.
        </p>

        <h3>Examples</h3>
        <div className="code-block"><p>She <strong>is</strong> happy. (linking: "happy" describes "she")</p></div>
        <div className="code-block"><p>The soup <strong>tastes</strong> great. (linking: describes "soup")</p></div>

        <h3>Action verbs vs linking verbs</h3>
        <p>
          Action verbs express something the subject does: "He <em>runs</em> every morning." Linking verbs do not show action — they link a subject to a subject complement that describes or renames it.
        </p>

        <h3>Common pitfalls</h3>
        <p>
          - Confusing forms: "She <em>looks</em> the picture" (incorrect) vs "She <em>looks</em> tired" (correct; "looks" here is linking).
        </p>
      </div>
    ),
  },
  {
    id: 4,
    title: 'Expanded sentence patterns: objects, complements, and modifiers',
    content: (
      <div className="article-content">
        <h2>Objects and complements</h2>
        <p>
          Beyond simple S-V or S-V-O patterns, English has complements and modifiers that give more detail.
        </p>
        <ul>
          <li><strong>Direct object</strong>: receives the action. (Ex: "She wrote <em>a letter</em>.")</li>
          <li><strong>Indirect object</strong>: to/for whom the action is done. (Ex: "She gave <em>him</em> a gift.")</li>
          <li><strong>Subject complement</strong>: follows linking verbs to describe or rename the subject. (Ex: "He became <em>a doctor</em>.")</li>
          <li><strong>Object complement</strong>: renames or describes the object. (Ex: "They named her <em>captain</em>.")</li>
        </ul>

        <h3>Modifiers</h3>
        <p>
          Adjectives, adverbs, prepositional phrases and relative clauses modify nouns and verbs to add detail:
        </p>
        <div className="code-block"><p>The <em>young</em> student read the book <em>quickly</em> in the <em>library</em>.</p></div>

        <h3>Complex sentences</h3>
        <p>
          Use subordinating conjunctions (because, although, when, if) to join clauses and create complex sentences. Example: "Although it rained, we continued the lesson."
        </p>
      </div>
    ),
  },
  {
    id: 5,
    title: 'Forming questions: auxiliary inversion, question words and tag questions',
    content: (
      <div className="article-content">
        <h2>Basic question forms</h2>
        <p>
          English has three common question patterns: yes/no questions (auxiliary inversion), wh-questions (question words), and tag questions.
        </p>

        <h3>Yes / No questions (inversion)</h3>
        <div className="code-block"><p>Statement: "She is coming." → Question: "Is she coming?"</p></div>
        <p>When there is no auxiliary, use <em>do/does/did</em>: "You like tea." → "Do you like tea?"</p>

        <h3>Wh- questions</h3>
        <p>Begin with a question word (what, where, when, why, who, how), then follow inversion rules:</p>
        <div className="code-block"><p>"Where did you go?" "Why is he late?"</p></div>

        <h3>Tag questions</h3>
        <p>Use a short question added to the end of a clause: "You're coming, aren't you?" The polarity reverses (positive statement → negative tag, and vice versa).</p>
      </div>
    ),
  },
  {
    id: 6,
    title: 'Parts of speech & function words: nouns, verbs, adjectives, adverbs, prepositions, conjunctions',
    content: (
      <div className="article-content">
        <h2>Overview of parts of speech</h2>
        <p>
          Knowing the parts of speech helps you build correct sentences. Here are the essentials:
        </p>
        <ul>
          <li><strong>Noun</strong>: person, place, thing, or idea (book, teacher, freedom).</li>
          <li><strong>Pronoun</strong>: replaces a noun (he, she, it, they).</li>
          <li><strong>Verb</strong>: action or state (run, be, have).</li>
          <li><strong>Adjective</strong>: describes a noun (happy, large).</li>
          <li><strong>Adverb</strong>: modifies verbs/adjectives (quickly, very).</li>
          <li><strong>Preposition</strong>: shows relationship/location (in, on, at, with).</li>
          <li><strong>Conjunction</strong>: links words/clauses (and, but, because).</li>
        </ul>

        <h3>Function words</h3>
        <p>
          Articles (a, an, the), determiners (this, those), and auxiliary verbs are function words — they carry grammatical meaning and are essential for correct structure.
        </p>
      </div>
    ),
  },
  {
    id: 7,
    title: 'Collocations: combining words naturally',
    content: (
      <div className="article-content">
        <h2>What are collocations?</h2>
        <p>
          Collocations are words that commonly go together. Native speakers instinctively pick these combinations (e.g., "make a decision", "heavy rain"). Learning collocations improves naturalness.
        </p>

        <h3>Types and examples</h3>
        <ul>
          <li>Verb + noun: make a decision, have a shower, do homework</li>
          <li>Adjective + noun: strong coffee, heavy rain, fast food</li>
          <li>Noun + verb: prices rise, engines roar</li>
        </ul>

        <h3>Practice tip</h3>
        <p>Read and note repeated word pairs. Use collocation dictionaries and practice sentences to internalize them.</p>
      </div>
    ),
  },
  {
    id: 8,
    title: 'Idioms: meaning, usage and how to learn them',
    content: (
      <div className="article-content">
        <h2>Understanding idioms</h2>
        <p>
          Idioms are fixed expressions whose meaning is not deducible from the literal words: "kick the bucket" (to die). They add color to language but must be learned as whole units.
        </p>

        <h3>Examples and register</h3>
        <ul>
          <li>Informal: "hit the sack" (go to bed)</li>
          <li>Neutral: "take into account" (consider)</li>
          <li>Formal idiomatic phrases: often avoided in academic writing</li>
        </ul>

        <h3>Learning strategies</h3>
        <p>Learn idioms in context, note register (formal/informal), and practise using them in sentences rather than translating word-by-word.</p>
      </div>
    ),
  },
  {
    id: 9,
    title: 'Gerunds and infinitives: when to use -ing vs to + verb',
    content: (
      <div className="article-content">
        <h2>Gerunds (-ing) and infinitives (to + verb)</h2>
        <p>
          Some verbs are followed by gerunds (doing), some by infinitives (to do), and some accept both with little or no change in meaning.
        </p>

        <h3>Common patterns</h3>
        <ul>
          <li>Verbs followed by gerund: enjoy, mind, avoid, suggest → "She enjoys reading."</li>
          <li>Verbs followed by infinitive: decide, hope, plan, promise → "They plan to travel."</li>
          <li>Verbs that take both (with meaning change): <em>stop</em>, <em>remember</em>, <em>forget</em>. (Ex: "I stopped smoking" vs "I stopped to smoke".)</li>
        </ul>

        <h3>Tips</h3>
        <p>
          Learn common verb patterns and practise with sentence frames. When in doubt, consult reliable references or examples.
        </p>
      </div>
    ),
  },
];

const PHONEME_DATA = [
  {
    title: 'VOWELS (MONOPHTHONGS)',
    type: 'monophthongs',
    phonemes: [
      { symbol: '/ɪ/', example: 'ship', session: 'Buổi 1' }, { symbol: '/i:/', example: 'sheep', session: 'Buổi 1' }, { symbol: '/e/', example: 'bed', session: 'Buổi 2' }, { symbol: '/æ/', example: 'cat', session: 'Buổi 2' }, { symbol: '/ʊ/', example: 'good', session: 'Buổi 3' }, { symbol: '/u:/', example: 'shoot', session: 'Buổi 3' }, { symbol: '/ə/', example: 'teacher', session: 'Buổi 3' }, { symbol: '/ɜ:/', example: 'bird', session: 'Buổi 3' }, { symbol: '/ɒ/', example: 'on', session: 'Buổi 9' }, { symbol: '/ɔ:/', example: 'door', session: 'Buổi 9' }, { symbol: '/ʌ/', example: 'up', session: 'Buổi 1' }, { symbol: '/ɑ:/', example: 'far', session: 'Buổi 1' },
    ],
  },
  {
    title: 'VOWELS (DIPHTHONGS)',
    type: 'diphthongs',
    phonemes: [
      { symbol: '/ɪə/', example: 'here', session: 'Buổi 5' }, { symbol: '/eə/', example: 'hair', session: 'Buổi 9' }, { symbol: '/eɪ/', example: 'wait', session: 'Buổi 5' }, { symbol: '/ɔɪ/', example: 'boy', session: 'Buổi 5' }, { symbol: '/aɪ/', example: 'my', session: 'Buổi 6' }, { symbol: '/əʊ/', example: 'show', session: 'Buổi 6' }, { symbol: '/aʊ/', example: 'cow', session: 'Buổi 6' }, { symbol: '/ʊə/', example: 'tourist', session: 'Buổi 8' },
    ],
  },
  {
    title: 'UNVOICED CONSONANTS',
    type: 'unvoiced_consonants',
    phonemes: [
      { symbol: '/p/', example: 'pea', session: 'Buổi 10' }, { symbol: '/t/', example: 'tea', session: 'Buổi 10' }, { symbol: '/k/', example: 'key', session: 'Buổi 10' }, { symbol: '/f/', example: 'fly', session: 'Buổi 11' }, { symbol: '/θ/', example: 'think', session: 'Buổi 12' }, { symbol: '/s/', example: 'see', session: 'Buổi 12' }, { symbol: '/ʃ/', example: 'she', session: 'Buổi 11' }, { symbol: '/tʃ/', example: 'cheese', session: 'Buổi 11' }, { symbol: '/h/', example: 'hat', session: 'Buổi 7' },
    ],
  },
   {
    title: 'VOICED CONSONANTS',
    type: 'voiced_consonants',
    phonemes: [
      { symbol: '/b/', example: 'boat', session: 'Buổi 10' }, { symbol: '/d/', example: 'dog', session: 'Buổi 10' }, { symbol: '/g/', example: 'go', session: 'Buổi 10' }, { symbol: '/v/', example: 'video', session: 'Buổi 11' }, { symbol: '/ð/', example: 'this', session: 'Buổi 12' }, { symbol: '/z/', example: 'zoo', session: 'Buổi 12' }, { symbol: '/ʒ/', example: 'television', session: 'Buổi 11' }, { symbol: '/dʒ/', example: 'june', session: 'Buổi 11' }, { symbol: '/m/', example: 'man', session: 'Buổi 7' }, { symbol: '/n/', example: 'now', session: 'Buổi 7' }, { symbol: '/ŋ/', example: 'sing', session: 'Buổi 7' }, { symbol: '/l/', example: 'love', session: 'Buổi 8' }, { symbol: '/r/', example: 'red', session: 'Buổi 8' }, { symbol: '/w/', example: 'wet', session: 'Buổi 8' }, { symbol: '/j/', example: 'yes', session: 'Buổi 8' },
    ],
  },
];

// --- COMPONENTS ---

const Section = ({ title, icon, isOpen, onToggle, children }) => {
  return (
    <div className="section">
      <button onClick={onToggle} className="section-toggle-button">
        <div className="section-title-container">
          {icon}
          <h2 className="section-title">{title}</h2>
        </div>
        <ChevronDownIcon className={isOpen ? 'open' : ''} />
      </button>
      <div className={`section-content-wrapper ${isOpen ? 'open' : ''}`}>
        <div className="section-content">
          {children}
        </div>
      </div>
    </div>
  );
};

const PhonemeCard = ({ phoneme, categoryType }) => {
  return (
    <div className={`phoneme-card ${categoryType}`}>
      <span className="symbol">{phoneme.symbol}</span>
      <span className="example">{phoneme.example}</span>
      <span className="session">{phoneme.session}</span>
    </div>
  );
};


const Resources = () => {
  const [openSections, setOpenSections] = useState({
    practice: true,
    pronunciation: false,
    grammar: true,
  });

  const [selectedArticle, setSelectedArticle] = useState(null);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
  };
  
  return (
    <div className="dashboard-layout resources-page">
      <Navbar />
      <div className="dashboard-content">
        <Sidebar />
        <main className="dashboard-main">
          <div className="resources-container">
          <header className="resources-header">
        <h1>Learning Resources</h1>
        <p>Your gateway to mastering English skills.</p>
      </header>
      
      <Section
        title="Practice More Skills"
        icon={<PencilIcon />}
        isOpen={openSections.practice}
        onToggle={() => toggleSection('practice')}
      >
        <ol className="content-list">
          {PRACTICE_LINKS.map((link, index) => (
            <li key={index}>
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.text}
              </a>
            </li>
          ))}
        </ol>
      </Section>
      
      <Section
        title="Pronunciation Practice"
        icon={<SoundWaveIcon />}
        isOpen={openSections.pronunciation}
        onToggle={() => toggleSection('pronunciation')}
      >
        <div className="pronunciation-content">
          <div className="ipa-chart-container">
            <h3>IPA Chart</h3>
            <img 
              src={ipaImage} 
              alt="IPA Phonemic Chart" 
              className="ipa-image"
            />
             <p>Note: You can print this out for better readability of the phonemes.</p>
          </div>
          <div className="phoneme-sessions-container">
            <h3>Sounds in Each Session</h3>
            <div className="phoneme-categories-container">
              {PHONEME_DATA.map(category => (
                <div key={category.title} className="phoneme-category">
                  <h4>{category.title}</h4>
                  <div className="phoneme-grid">
                    {category.phonemes.map(phoneme => (
                      <PhonemeCard key={phoneme.symbol} phoneme={phoneme} categoryType={category.type} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Grammar Support Series"
        icon={<BookOpenIcon />}
        isOpen={openSections.grammar}
        onToggle={() => toggleSection('grammar')}
      >
        {selectedArticle ? (
          <div>
            <button onClick={handleBackToList} className="back-button">
              <ArrowLeftIcon />
              Back to Grammar List
            </button>
            {selectedArticle.content}
          </div>
        ) : (
          <ol className="content-list">
            {GRAMMAR_ARTICLES.map((article) => (
              <li key={article.id}>
                <button onClick={() => handleArticleSelect(article)}>
                  {article.title}
                </button>
              </li>
            ))}
          </ol>
        )}
      </Section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Resources;
