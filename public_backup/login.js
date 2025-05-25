import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    sendPasswordResetEmail,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDw5OoWiJj_Wx336huYLqdoLSjyNpXJrR4",
    authDomain: "ia-docente-app.firebaseapp.com",
    projectId: "ia-docente-app",
    storageBucket: "ia-docente-app.firebasestorage.app",
    messagingSenderId: "596905665962",
    appId: "1:596905665962:web:5dafa9d4f098b2df41b7d3",
    measurementId: "G-LCD9GYD2Q1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Enhanced Auth Manager with Firebase Integration
class FirebaseAuthManager {
    constructor() {
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.showRegisterBtn = document.getElementById('show-register');
        this.showLoginBtn = document.getElementById('show-login');

        this.init();
    }

    init() {
        // Check authentication state
        this.checkAuthState();

        // Form toggle events
        this.showRegisterBtn?.addEventListener('click', (e) => this.showRegister(e));
        this.showLoginBtn?.addEventListener('click', (e) => this.showLogin(e));

        // Form submission events
        this.setupFormSubmissions();

        // Input validation events
        this.setupInputValidation();

        // Google button events
        this.setupGoogleButtons();

        // Password visibility toggle
        this.setupPasswordToggle();

        // Add forgot password functionality
        this.setupForgotPassword();
    }

    checkAuthState() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in, redirect to dashboard
                console.log('User is signed in:', user.email);
                this.redirectToDashboard();
            } else {
                // User is signed out
                console.log('User is signed out');
            }
        });
    }

    redirectToDashboard() {
        // Small delay to show success message
        setTimeout(() => {
            window.location.href = 'template.html';
        }, 1500);
    }

    showRegister(e) {
        e.preventDefault();
        this.loginForm.classList.add('hidden');
        this.registerForm.classList.remove('hidden');
        this.clearForms();
    }

    showLogin(e) {
        e.preventDefault();
        this.registerForm.classList.add('hidden');
        this.loginForm.classList.remove('hidden');
        this.clearForms();
    }

    clearForms() {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.value = '';
            input.classList.remove('error', 'success');
        });
        this.clearErrorMessages();
    }

    setupFormSubmissions() {
        // Login form submission
        const loginFormElement = this.loginForm?.querySelector('.form');
        loginFormElement?.addEventListener('submit', (e) => this.handleLogin(e));

        // Register form submission
        const registerFormElement = this.registerForm?.querySelector('.form');
        registerFormElement?.addEventListener('submit', (e) => this.handleRegister(e));
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        // Validate inputs
        if (!this.validateLogin(email, password)) {
            return;
        }

        // Show loading state
        const submitBtn = e.target.querySelector('.btn-primary');
        this.showLoading(submitBtn, 'Ingresando...');

        try {
            // Firebase login
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Success
            this.showSuccessMessage(`¡Bienvenido de nuevo, ${user.displayName || user.email}!`);

            // Clear form
            e.target.reset();

            // Redirect will be handled by onAuthStateChanged

        } catch (error) {
            console.error('Login error:', error);
            this.handleFirebaseError(error);
        } finally {
            this.hideLoading(submitBtn, 'Ingresar');
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;

        // Validate inputs
        if (!this.validateRegister(name, email, password, confirmPassword)) {
            return;
        }

        // Show loading state
        const submitBtn = e.target.querySelector('.btn-primary');
        this.showLoading(submitBtn, 'Registrando...');

        try {
            // Create user with Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update user profile with name
            await updateProfile(user, {
                displayName: name
            });

            // Success
            this.showSuccessMessage(`¡Bienvenido a EducaPro, ${name}!`);

            // Clear form
            e.target.reset();

            // Redirect will be handled by onAuthStateChanged

        } catch (error) {
            console.error('Registration error:', error);
            this.handleFirebaseError(error);
        } finally {
            this.hideLoading(submitBtn, 'Registrarse');
        }
    }

    handleFirebaseError(error) {
        let message = 'Ha ocurrido un error. Inténtalo de nuevo.';

        switch (error.code) {
            case 'auth/user-not-found':
                message = 'No existe una cuenta con este correo electrónico.';
                break;
            case 'auth/wrong-password':
                message = 'Contraseña incorrecta.';
                break;
            case 'auth/email-already-in-use':
                message = 'Ya existe una cuenta con este correo electrónico.';
                break;
            case 'auth/weak-password':
                message = 'La contraseña debe tener al menos 6 caracteres.';
                break;
            case 'auth/invalid-email':
                message = 'El formato del correo electrónico no es válido.';
                break;
            case 'auth/too-many-requests':
                message = 'Demasiados intentos fallidos. Inténtalo más tarde.';
                break;
            case 'auth/network-request-failed':
                message = 'Error de conexión. Verifica tu internet.';
                break;
            case 'auth/user-disabled':
                message = 'Esta cuenta ha sido deshabilitada.';
                break;
            default:
                message = error.message;
        }

        this.showErrorMessage(message);
    }

    validateLogin(email, password) {
        let isValid = true;
        this.clearErrorMessages();

        if (!email) {
            this.showFieldError('login-email', 'El correo es requerido');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError('login-email', 'Ingresa un correo válido');
            isValid = false;
        }

        if (!password) {
            this.showFieldError('login-password', 'La contraseña es requerida');
            isValid = false;
        }

        return isValid;
    }

    validateRegister(name, email, password, confirmPassword) {
        let isValid = true;
        this.clearErrorMessages();

        if (!name) {
            this.showFieldError('register-name', 'El nombre es requerido');
            isValid = false;
        } else if (name.length < 2) {
            this.showFieldError('register-name', 'El nombre debe tener al menos 2 caracteres');
            isValid = false;
        }

        if (!email) {
            this.showFieldError('register-email', 'El correo es requerido');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError('register-email', 'Ingresa un correo válido');
            isValid = false;
        }

        if (!password) {
            this.showFieldError('register-password', 'La contraseña es requerida');
            isValid = false;
        } else if (password.length < 6) {
            this.showFieldError('register-password', 'La contraseña debe tener al menos 6 caracteres');
            isValid = false;
        }

        if (!confirmPassword) {
            this.showFieldError('register-confirm', 'Confirma tu contraseña');
            isValid = false;
        } else if (password !== confirmPassword) {
            this.showFieldError('register-confirm', 'Las contraseñas no coinciden');
            isValid = false;
        }

        return isValid;
    }

    setupInputValidation() {
        const inputs = document.querySelectorAll('input');

        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('focus', () => this.clearFieldError(input.id));
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateField(input);
                }
            });
        });
    }

    validateField(input) {
        const value = input.value.trim();
        const fieldId = input.id;

        switch (fieldId) {
            case 'login-email':
            case 'register-email':
                if (value && !this.isValidEmail(value)) {
                    this.showFieldError(fieldId, 'Correo inválido');
                } else if (value) {
                    this.clearFieldError(fieldId);
                    input.classList.add('success');
                }
                break;

            case 'register-password':
                if (value && value.length < 6) {
                    this.showFieldError(fieldId, 'Mínimo 6 caracteres');
                } else if (value) {
                    this.clearFieldError(fieldId);
                    input.classList.add('success');
                }
                break;

            case 'register-confirm':
                const password = document.getElementById('register-password').value;
                if (value && value !== password) {
                    this.showFieldError(fieldId, 'Las contraseñas no coinciden');
                } else if (value && value === password) {
                    this.clearFieldError(fieldId);
                    input.classList.add('success');
                }
                break;

            case 'register-name':
                if (value && value.length < 2) {
                    this.showFieldError(fieldId, 'Mínimo 2 caracteres');
                } else if (value) {
                    this.clearFieldError(fieldId);
                    input.classList.add('success');
                }
                break;
        }
    }

    setupGoogleButtons() {
        const googleButtons = document.querySelectorAll('.btn-google');

        googleButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleGoogleLogin());
        });
    }

    async handleGoogleLogin() {
        try {
            const googleBtns = document.querySelectorAll('.btn-google');
            googleBtns.forEach(btn => this.showLoading(btn, 'Conectando...'));

            // Sign in with Google
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            this.showSuccessMessage(`¡Bienvenido, ${user.displayName}!`);

            // Redirect will be handled by onAuthStateChanged

        } catch (error) {
            console.error('Google login error:', error);

            if (error.code === 'auth/popup-closed-by-user') {
                this.showErrorMessage('Inicio de sesión cancelado.');
            } else {
                this.handleFirebaseError(error);
            }
        } finally {
            const googleBtns = document.querySelectorAll('.btn-google');
            googleBtns.forEach(btn => this.hideLoading(btn, 'Continuar con Google'));
        }
    }

    setupPasswordToggle() {
        const passwordInputs = document.querySelectorAll('input[type="password"]');

        passwordInputs.forEach(input => {
            if (input.parentElement.querySelector('.password-toggle')) return; // Already has toggle

            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.innerHTML = '👁️';
            toggleBtn.className = 'password-toggle';
            toggleBtn.style.cssText = `
                position: absolute;
                right: 15px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                cursor: pointer;
                font-size: 18px;
                opacity: 0.6;
                transition: opacity 0.3s ease;
                z-index: 10;
            `;

            input.parentElement.style.position = 'relative';
            input.parentElement.appendChild(toggleBtn);

            toggleBtn.addEventListener('click', () => {
                if (input.type === 'password') {
                    input.type = 'text';
                    toggleBtn.innerHTML = '🙈';
                } else {
                    input.type = 'password';
                    toggleBtn.innerHTML = '👁️';
                }
            });

            toggleBtn.addEventListener('mouseover', () => toggleBtn.style.opacity = '1');
            toggleBtn.addEventListener('mouseout', () => toggleBtn.style.opacity = '0.6');
        });
    }

    setupForgotPassword() {
        // Add forgot password link to login form
        const loginForm = this.loginForm?.querySelector('.form');
        if (loginForm && !loginForm.querySelector('.forgot-password')) {
            const forgotLink = document.createElement('a');
            forgotLink.href = '#';
            forgotLink.textContent = '¿Olvidaste tu contraseña?';
            forgotLink.className = 'forgot-password';
            forgotLink.style.cssText = `
                color: #667eea;
                text-decoration: none;
                font-size: 14px;
                text-align: center;
                display: block;
                margin: 10px 0;
                transition: color 0.3s ease;
            `;

            forgotLink.addEventListener('mouseover', () => {
                forgotLink.style.color = '#5a6fd8';
                forgotLink.style.textDecoration = 'underline';
            });

            forgotLink.addEventListener('mouseout', () => {
                forgotLink.style.color = '#667eea';
                forgotLink.style.textDecoration = 'none';
            });

            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });

            // Insert before the primary button
            const primaryBtn = loginForm.querySelector('.btn-primary');
            loginForm.insertBefore(forgotLink, primaryBtn);
        }
    }

    async handleForgotPassword() {
        const email = document.getElementById('login-email').value.trim();

        if (!email) {
            this.showErrorMessage('Ingresa tu correo electrónico primero.');
            document.getElementById('login-email').focus();
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showErrorMessage('Ingresa un correo electrónico válido.');
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            this.showSuccessMessage(`Se ha enviado un enlace de recuperación a ${email}`);
        } catch (error) {
            console.error('Password reset error:', error);
            this.handleFirebaseError(error);
        }
    }

    // Utility functions
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showFieldError(fieldId, message) {
        const input = document.getElementById(fieldId);
        if (!input) return;

        input.classList.remove('success');
        input.classList.add('error');

        this.clearFieldError(fieldId);

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #e74c3c;
            font-size: 12px;
            margin-top: 5px;
            animation: fadeIn 0.3s ease;
        `;

        input.parentElement.appendChild(errorDiv);
    }

    clearFieldError(fieldId) {
        const input = document.getElementById(fieldId);
        if (!input) return;

        input.classList.remove('error');

        const errorMessage = input.parentElement.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    clearErrorMessages() {
        const messages = document.querySelectorAll('.error-message, .success-message, .general-error');
        messages.forEach(msg => msg.remove());

        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => input.classList.remove('error', 'success'));
    }

    showSuccessMessage(message) {
        this.clearErrorMessages();

        const container = document.querySelector('.form-container:not(.hidden)');
        if (!container) return;

        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            background: #d4edda;
            color: #155724;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #c3e6cb;
            animation: fadeIn 0.3s ease;
        `;

        container.insertBefore(successDiv, container.querySelector('.form'));
    }

    showErrorMessage(message) {
        this.clearErrorMessages();

        const container = document.querySelector('.form-container:not(.hidden)');
        if (!container) return;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'general-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #f5c6cb;
            animation: fadeIn 0.3s ease;
        `;

        container.insertBefore(errorDiv, container.querySelector('.form'));
    }

    showLoading(button, text) {
        if (!button) return;
        button.disabled = true;
        button.textContent = text;
        button.style.opacity = '0.7';
    }

    hideLoading(button, originalText) {
        if (!button) return;
        button.disabled = false;
        button.textContent = originalText;
        button.style.opacity = '1';
    }
}

const enhancedStyles = `
input.error {
    border-color: #e74c3c !important;
    background-color: #fdf2f2 !important;
}

input.success {
    border-color: #27ae60 !important;
    background-color: #f2fdf2 !important;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

.error {
    animation: shake 0.5s ease-in-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.password-toggle:hover {
    opacity: 1 !important;
}

.forgot-password:hover {
    color: #5a6fd8 !important;
    text-decoration: underline !important;
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = enhancedStyles;
document.head.appendChild(styleSheet);

document.addEventListener('DOMContentLoaded', () => {
    new FirebaseAuthManager();
});

window.FirebaseAuthManager = FirebaseAuthManager;