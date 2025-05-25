import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collectionGroup, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

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

const templatesContainer = document.getElementById('templates-container');
const logoutBtn = document.getElementById('btn-logout');

async function getUserName(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.displayName || userData.email || userId;
    } else {
      return userId;
    }
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return userId;
  }
}

async function loadTemplates() {
  try {
    const templatesColGroup = collectionGroup(db, 'plantillas');
    const snapshot = await getDocs(templatesColGroup);

    const templatesPromises = snapshot.docs.map(async docSnap => {
      const data = docSnap.data();
      // Extraer userId del path (users/{userId}/plantillas/{templateId})
      const pathSegments = docSnap.ref.path.split('/');
      const userIdIndex = pathSegments.indexOf('users') + 1;
      const userId = pathSegments[userIdIndex];
      const ownerName = await getUserName(userId);

      return {
        id: docSnap.id,
        userId,
        ownerName,
        ...data
      };
    });

    const templates = await Promise.all(templatesPromises);
    showTemplates(templates);
  } catch (error) {
    templatesContainer.innerHTML = '<p style="color:red;">Error al cargar las plantillas.</p>';
    console.error(error);
  }
}

function showTemplates(templates) {
  templatesContainer.innerHTML = '';
  if (templates.length === 0) {
    templatesContainer.innerHTML = '<p>No hay plantillas disponibles.</p>';
    return;
  }
  templates.forEach(t => {
    const div = document.createElement('div');
    div.classList.add('template-card');
    div.innerHTML = `
      <h3>${t.tema || 'Sin tema'}</h3>
      <p><strong>Tipo:</strong> ${t.tipoPlantilla || 'Sin descripción'}</p>
      <p><strong>Docente:</strong> ${t.ownerName}</p>
      <button onclick="window.location.href = 'template-detail.html?userId=${t.userId}&id=${t.id}'">Abrir plantilla</button>
    `;
    templatesContainer.appendChild(div);
  });
}

logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, user => {
  if (user) {
    loadTemplates();
  } else {
    window.location.href = 'index.html';
  }
});
