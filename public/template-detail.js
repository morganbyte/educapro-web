import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDw5OoWiJj_Wx336huYLqdoLSjyNpXJrR4",
  authDomain: "ia-docente-app.firebaseapp.com",
  projectId: "ia-docente-app",
  storageBucket: "ia-docente-app.firebasestorage.app",
  messagingSenderId: "596905665962",
  appId: "1:596905665962:web:5dafa9d4f098b2df41b7d3",
  measurementId: "G-LCD9GYD2Q1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const btnBack = document.getElementById('btn-back');
const templateContent = document.getElementById('template-content');
const templateTitle = document.getElementById('template-title');

btnBack.onclick = () => window.location.href = 'template.html';

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('userId');
const templateId = urlParams.get('id');

let examData = null;
let quizData = null;
let workShopData = null;

let currentQuestionIndex = 0;
let userAnswers = [];

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = 'index.html';
  } else {
    if (!userId || !templateId) {
      templateContent.innerHTML = '<p>ID o usuario no especificados en la URL.</p>';
      return;
    }
    loadTemplate();
  }
});

async function loadTemplate() {
  try {
    const docRef = doc(db, 'users', userId, 'plantillas', templateId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      templateContent.innerHTML = '<p>Plantilla no encontrada.</p>';
      return;
    }

    const data = docSnap.data();
    templateTitle.textContent = data.tema || 'Detalle de Plantilla';

    if (data.tipoPlantilla === 'Exámenes') {
      examData = typeof data.jsonRespuesta === 'string' ? JSON.parse(data.jsonRespuesta) : data.jsonRespuesta;
      userAnswers = Array(examData.preguntas.length).fill(null);
      renderExam();
      showExamQuestion();
    } else if (data.tipoPlantilla === 'Quizzes') {
      quizData = typeof data.jsonRespuesta === 'string' ? JSON.parse(data.jsonRespuesta) : data.jsonRespuesta;
      userAnswers = Array(quizData.preguntas.length).fill(null);
      renderQuiz();
      showQuizQuestion();
    } else if (data.tipoPlantilla === 'Talleres') {
      workShopData = typeof data.jsonRespuesta === 'string' ? JSON.parse(data.jsonRespuesta) : data.jsonRespuesta;
      renderWorkshop();
    } else {
      renderOtherTemplate(data);
    }
  } catch (error) {
    templateContent.innerHTML = '<p>Error al cargar la plantilla.</p>';
    console.error(error);
  }
}

// -------------------- EXAMENES --------------------

function renderExam() {
  templateContent.innerHTML = `
    <div id="question-container"></div>
    <div class="navigation-buttons">
      <button id="btn-prev" disabled>Anterior</button>
      <button id="btn-next" disabled>Siguiente</button>
      <button id="btn-finish" style="display:none;">Finalizar</button>
    </div>
    <div id="result-container" style="display:none;">
      <h2>Exámenes Completado</h2>
      <p id="score-percentage"></p>
      <div id="review-container"></div>
      <button id="btn-retry">Reintentar</button>
    </div>
  `;

  document.getElementById('btn-prev').onclick = prevExamQuestion;
  document.getElementById('btn-next').onclick = nextExamQuestion;
  document.getElementById('btn-finish').onclick = finishExam;
  document.getElementById('btn-retry').onclick = retryExam;
}

function showExamQuestion() {
  const questionContainer = document.getElementById('question-container');
  const question = examData.preguntas[currentQuestionIndex];

  questionContainer.innerHTML = `
    <div class="question-text">${question.pregunta}</div>
    <ul class="options">
      ${question.opciones.map((option, i) => `
        <li>
          <button class="${userAnswers[currentQuestionIndex] === i ? 'selected' : ''}" data-index="${i}">
            ${String.fromCharCode(65 + i)}. ${option}
          </button>
        </li>
      `).join('')}
    </ul>
  `;

  updateExamenNavigationButtons();

  const buttons = questionContainer.querySelectorAll('button');
  buttons.forEach(button => {
    button.onclick = () => {
      userAnswers[currentQuestionIndex] = Number(button.dataset.index);
      showExamQuestion();
    };
  });
}

function updateExamenNavigationButtons() {
  document.getElementById('btn-prev').disabled = currentQuestionIndex === 0;
  document.getElementById('btn-next').disabled = userAnswers[currentQuestionIndex] == null;
  document.getElementById('btn-next').style.display = (currentQuestionIndex === examData.preguntas.length - 1) ? 'none' : 'inline-block';
  document.getElementById('btn-finish').style.display = (currentQuestionIndex === examData.preguntas.length - 1) ? 'inline-block' : 'none';
}

function prevExamQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    showExamQuestion();
  }
}

function nextExamQuestion() {
  if (userAnswers[currentQuestionIndex] == null) {
    alert('Por favor, selecciona una respuesta antes de continuar.');
    return;
  }
  if (currentQuestionIndex < examData.preguntas.length - 1) {
    currentQuestionIndex++;
    showExamQuestion();
  }
}

function finishExam() {
  if (userAnswers[currentQuestionIndex] == null) {
    alert('Por favor, selecciona una respuesta antes de finalizar.');
    return;
  }
  showResults();
}

function showResults() {
  const resultContainer = document.getElementById('result-container');
  const questionContainer = document.getElementById('question-container');
  const reviewContainer = document.getElementById('review-container');
  const scorePercentage = document.getElementById('score-percentage');

  resultContainer.style.display = 'block';
  questionContainer.style.display = 'none';
  document.querySelector('.navigation-buttons').style.display = 'none';

  let correctCount = 0;
  reviewContainer.innerHTML = '';

  examData.preguntas.forEach((pregunta, index) => {
    const userAnswerIndex = userAnswers[index];
    const userAnswerText = pregunta.opciones[userAnswerIndex];
    const isCorrect = userAnswerText === pregunta.respuestaCorrecta;
    if (isCorrect) correctCount++;

    const div = document.createElement('div');
    div.classList.add('review-question', isCorrect ? 'correct' : 'incorrect');

    div.innerHTML = `
      <strong>Pregunta ${index + 1}</strong>
      <p>${pregunta.pregunta}</p>
      <p>Tu respuesta: ${userAnswerIndex !== null ? userAnswerText : 'Sin responder'}</p>
      ${!isCorrect ? `<p>Respuesta correcta: ${pregunta.respuestaCorrecta}</p>` : ''}
    `;

    reviewContainer.appendChild(div);
  });

  const scorePercent = ((correctCount / examData.preguntas.length) * 100).toFixed(1);
  scorePercentage.textContent = `${correctCount} de ${examData.preguntas.length} correctas - ${scorePercent}%`;
}

function retryExam() {
  document.getElementById('result-container').style.display = 'none';
  document.getElementById('question-container').style.display = 'block';
  document.querySelector('.navigation-buttons').style.display = 'flex';
  userAnswers = Array(examData.preguntas.length).fill(null);
  currentQuestionIndex = 0;
  showExamQuestion();
}

// -------------------- QUIZZES --------------------

function renderQuiz() {
  templateContent.innerHTML = `
    <div id="quiz-question-container"></div>
    <div class="navigation-buttons">
      <button id="btn-prev" disabled>Anterior</button>
      <button id="btn-next" disabled>Siguiente</button>
      <button id="btn-finish" style="display:none;">Finalizar</button>
    </div>
    <div id="quiz-result-container" style="display:none;">
      <h2>Quiz Completado</h2>
      <p id="quiz-score-percentage"></p>
      <div id="quiz-review-container"></div>
      <button id="btn-retry">Reintentar</button>
    </div>
  `;

  document.getElementById('btn-prev').onclick = prevQuizQuestion;
  document.getElementById('btn-next').onclick = nextQuizQuestion;
  document.getElementById('btn-finish').onclick = finishQuiz;
  document.getElementById('btn-retry').onclick = retryQuiz;

  currentQuestionIndex = 0;
  userAnswers = Array(quizData.preguntas.length).fill(null);

  showQuizQuestion();
}

function showQuizQuestion() {
  const questionContainer = document.getElementById('quiz-question-container');
  const question = quizData.preguntas[currentQuestionIndex];

  questionContainer.innerHTML = `
    <div class="question-text">${question.pregunta}</div>
    <ul class="options">
      ${question.opciones.map((option, i) => `
        <li><button class="${userAnswers[currentQuestionIndex] === i ? 'selected' : ''}" data-index="${i}">
          ${String.fromCharCode(65 + i)}. ${option}
        </button></li>`).join('')}
    </ul>
  `;

  updateQuizNavigationButtons();

  const buttons = questionContainer.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.onclick = () => {
      userAnswers[currentQuestionIndex] = Number(btn.dataset.index);
      showQuizQuestion();
    };
  });
}

function updateQuizNavigationButtons() {
  document.getElementById('btn-prev').disabled = currentQuestionIndex === 0;
  document.getElementById('btn-next').disabled = userAnswers[currentQuestionIndex] == null;
  document.getElementById('btn-next').style.display = (currentQuestionIndex === quizData.preguntas.length - 1) ? 'none' : 'inline-block';
  document.getElementById('btn-finish').style.display = (currentQuestionIndex === quizData.preguntas.length - 1) ? 'inline-block' : 'none';
}

function prevQuizQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    showQuizQuestion();
  }
}

function nextQuizQuestion() {
  if (userAnswers[currentQuestionIndex] == null) {
    alert('Por favor, selecciona una respuesta antes de continuar.');
    return;
  }
  if (currentQuestionIndex < quizData.preguntas.length - 1) {
    currentQuestionIndex++;
    showQuizQuestion();
  }
}

function finishQuiz() {
  if (userAnswers[currentQuestionIndex] == null) {
    alert('Por favor, selecciona una respuesta antes de finalizar.');
    return;
  }
  showQuizResults();
}

function showQuizResults() {
  const resultContainer = document.getElementById('quiz-result-container');
  const questionContainer = document.getElementById('quiz-question-container');
  const reviewContainer = document.getElementById('quiz-review-container');
  const scorePercentage = document.getElementById('quiz-score-percentage');

  resultContainer.style.display = 'block';
  questionContainer.style.display = 'none';
  document.querySelector('.navigation-buttons').style.display = 'none';

  let correctCount = 0;
  reviewContainer.innerHTML = '';

  quizData.preguntas.forEach((pregunta, index) => {
    const userAnswerIndex = userAnswers[index];
    const correctIndex = pregunta.opciones.indexOf(pregunta.respuestaCorrecta);
    const isCorrect = userAnswerIndex === correctIndex;
    if (isCorrect) correctCount++;

    const div = document.createElement('div');
    div.classList.add('review-question', isCorrect ? 'correct' : 'incorrect');

    div.innerHTML = `
      <strong>Pregunta ${index + 1}</strong>
      <p>${pregunta.pregunta}</p>
      <p>Tu respuesta: ${userAnswerIndex !== null ? pregunta.opciones[userAnswerIndex] : 'Sin responder'}</p>
      ${!isCorrect ? `<p>Respuesta correcta: ${pregunta.respuestaCorrecta}</p>` : ''}
    `;

    reviewContainer.appendChild(div);
  });

  const scorePercent = ((correctCount / quizData.preguntas.length) * 100).toFixed(1);
  scorePercentage.textContent = `${correctCount} de ${quizData.preguntas.length} correctas - ${scorePercent}%`;
}

function retryQuiz() {
  document.getElementById('quiz-result-container').style.display = 'none';
  document.getElementById('quiz-question-container').style.display = 'block';
  document.querySelector('.navigation-buttons').style.display = 'flex';
  userAnswers = Array(quizData.preguntas.length).fill(null);
  currentQuestionIndex = 0;
  showQuizQuestion();
}

// -------------------- TALLERES --------------------

function renderWorkshop() {
  let completedCount = 0;

  const actividades = Array.isArray(workShopData.actividadesTaller) ? workShopData.actividadesTaller : [];

  const actividadesHTML = actividades.map((act, index) => {
    const isCompleted = act.completada === true;
    if (isCompleted) completedCount++;

    return `
      <div class="actividad-card ${isCompleted ? 'completada' : ''}">
        <div class="actividad-header">
          <span class="actividad-numero">${index + 1}</span>
          <h3>${act.tituloActividad || act.titulo || 'Actividad'}</h3>
        </div>
        <p>${act.descripcionActividad || act.descripcion || ''}</p>
        <div class="notas-observaciones">
          <label for="nota-${index}">Notas y Observaciones</label>
          <textarea id="nota-${index}" placeholder="Escribe tus notas sobre esta actividad...">${act.notas || ''}</textarea>
        </div>
        <button class="btn-marcar" data-index="${index}">
          ${isCompleted ? 'Completada' : 'Marcar como completada'}
        </button>
      </div>
    `;
  }).join('');

  const progresoPercent = actividades.length > 0 ? Math.round((completedCount / actividades.length) * 100) : 0;

  templateContent.innerHTML = `
    <section class="workshop-info">
      <div class="info-card nombre-taller">
        <h2>Nombre del Taller</h2>
        <p>${workShopData.nombreTaller || workShopData.nombre || 'Sin nombre'}</p>
      </div>
      <div class="info-card ebc">
        <h2>Estándar Básico de Competencias (E.B.C)</h2>
        <p>${workShopData.estandarBasicoCompetencias || 'No especificado'}</p>
      </div>
      <div class="info-card dba">
        <h2>Derechos Básicos de Aprendizaje (D.B.A)</h2>
        <p>${workShopData.derechosBasicosAprendizaje || 'No especificado'}</p>
      </div>
    </section>

    <section class="actividades">
      <h2>Actividades del Taller</h2>
      ${actividadesHTML}
      <div class="progreso">
        <label>Progreso del Taller</label>
        <progress value="${completedCount}" max="${actividades.length}"></progress>
        <span>${completedCount} de ${actividades.length} actividades completadas</span>
        <span>${progresoPercent}%</span>
      </div>
    </section>
  `;

  document.querySelectorAll('.btn-marcar').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = Number(e.target.dataset.index);
      actividades[idx].completada = !actividades[idx].completada;
      if (!actividades[idx].notas) actividades[idx].notas = '';
      renderWorkshop();
    });
  });

  document.querySelectorAll('.notas-observaciones textarea').forEach((textarea, idx) => {
    textarea.addEventListener('input', e => {
      actividades[idx].notas = e.target.value;
    });
  });
}

// -------------------- OTROS --------------------

function renderOtherTemplate(data) {
  templateContent.innerHTML = `
    <p><strong>Tipo de plantilla:</strong> ${data.tipoPlantilla || 'No especificado'}</p>
    <p><strong>Creada el:</strong> ${data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : data.createdAt || 'No disponible'}</p>
    <h3>Contenido JSON</h3>
    <pre>${JSON.stringify(data.jsonRespuesta, null, 2)}</pre>
  `;
}
