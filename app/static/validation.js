document.addEventListener('DOMContentLoaded', function() {
    // تهيئة مكتبة intl-tel-input لرقم الهاتف
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        const iti = window.intlTelInput(phoneInput, {
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
            preferredCountries: ['us', 'sa', 'eg', 'ae'],
            separateDialCode: true,
            initialCountry: "auto",
            geoIpLookup: function(callback) {
                fetch("https://ipapi.co/json")
                    .then(res => res.json())
                    .then(data => callback(data.country_code))
                    .catch(() => callback("us"));
            }
        });
    }

    // التحقق من صحة المدخلات أثناء الكتابة
    function setupValidation(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const inputs = form.querySelectorAll('input[required], select[required]');
        const submitBtn = form.querySelector('button[type="submit"]');

        inputs.forEach(input => {
            input.addEventListener('input', function() {
                validateInput(this);
                checkFormValidity(form, submitBtn);
            });

            input.addEventListener('blur', function() {
                validateInput(this);
                checkFormValidity(form, submitBtn);
            });
        });

        // التحقق من صحة خانة الاختيار
        const termsCheckbox = form.querySelector('input[type="checkbox"][name="terms"]');
        if (termsCheckbox) {
            termsCheckbox.addEventListener('change', function() {
                validateInput(this);
                checkFormValidity(form, submitBtn);
            });
        }
    }

    // التحقق من صحة حقل معين
    function validateInput(input) {
        const formGroup = input.closest('.form-group, .form-check');
        const icon = formGroup.querySelector('.validation-icon');
        const hint = formGroup.querySelector('.hint');
        let isValid = false;
        let hintText = '';

        switch(input.type) {
            case 'email':
                isValid = validateEmail(input.value);
                hintText = isValid ? '' : 'بريد إلكتروني غير صالح';
                break;
            case 'password':
                if (input.name === 'password') {
                    isValid = validatePassword(input.value);
                    hintText = isValid ? '' : 'يجب أن تحتوي كلمة المرور على أحرف كبيرة وصغيرة وأرقام ورموز';
                    updatePasswordStrength(input.value);
                } else if (input.name === 'confirm_password') {
                    const password = document.getElementById('password').value;
                    isValid = input.value === password && password.length > 0;
                    hintText = isValid ? '' : 'كلمة المرور غير متطابقة';
                }
                break;
            case 'text':
                if (input.name === 'username') {
                    isValid = input.value.length >= 4;
                    hintText = isValid ? '' : 'يجب أن يكون اسم المستخدم 4 أحرف على الأقل';
                    if (isValid) {
                        checkUsernameAvailability(input.value, formGroup);
                    }
                } else {
                    isValid = input.value.trim() !== '';
                }
                break;
            case 'checkbox':
                isValid = input.checked;
                hintText = isValid ? '' : 'يجب الموافقة على الشروط والأحكام';
                break;
            case 'tel':
                isValid = input.value.trim() !== '';
                break;
            default:
                isValid = input.value.trim() !== '';
        }

        updateValidationUI(formGroup, isValid, hintText);
    }

    // التحقق من توفر اسم المستخدم
    function checkUsernameAvailability(username, formGroup) {
        showLoading(formGroup, true);
        
        // محاكاة طلب AJAX للتحقق من اسم المستخدم
        setTimeout(() => {
            // في التطبيق الحقيقي، استبدل هذا بطلب AJAX إلى الخادم
            const isAvailable = Math.random() > 0.5; // محاكاة عشوائية لأغراض العرض
            
            showLoading(formGroup, false);
            updateValidationUI(
                formGroup, 
                isAvailable, 
                isAvailable ? '' : 'اسم المستخدم غير متوفر'
            );
        }, 1000);
    }

    // التحقق من صحة البريد الإلكتروني
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // التحقق من قوة كلمة المرور
    function validatePassword(password) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
    }

    // تحديث شريط قوة كلمة المرور
    function updatePasswordStrength(password) {
        const strengthBar = document.querySelector('.strength-bar');
        if (!strengthBar) return;

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        const width = (strength / 5) * 100;
        strengthBar.style.width = width + '%';

        if (strength < 3) {
            strengthBar.style.backgroundColor = '#dc3545';
        } else if (strength < 5) {
            strengthBar.style.backgroundColor = '#fd7e14';
        } else {
            strengthBar.style.backgroundColor = '#28a745';
        }
    }

    // تحديث واجهة التحقق
    function updateValidationUI(formGroup, isValid, hintText = '') {
        const icon = formGroup.querySelector('.validation-icon');
        const hint = formGroup.querySelector('.hint');

        formGroup.classList.remove('valid', 'invalid');
        icon.querySelectorAll('.valid-icon, .invalid-icon').forEach(i => i.style.display = 'none');

        if (formGroup.querySelector('.loading-icon')?.style.display === 'block') {
            return;
        }

        if (isValid) {
            formGroup.classList.add('valid');
            icon.querySelector('.valid-icon').style.display = 'inline-block';
        } else {
            formGroup.classList.add('invalid');
            icon.querySelector('.invalid-icon').style.display = 'inline-block';
        }

        if (hint) {
            hint.textContent = hintText;
            hint.style.display = hintText ? 'block' : 'none';
        }
    }

    // عرض حالة التحميل
    function showLoading(formGroup, isLoading) {
        const icon = formGroup.querySelector('.validation-icon');
        if (!icon) return;

        const loadingIcon = icon.querySelector('.loading-icon');
        if (!loadingIcon) return;

        if (isLoading) {
            formGroup.classList.remove('valid', 'invalid');
            icon.querySelectorAll('.valid-icon, .invalid-icon').forEach(i => i.style.display = 'none');
            loadingIcon.style.display = 'inline-block';
        } else {
            loadingIcon.style.display = 'none';
        }
    }

    // التحقق من صحة النموذج بالكامل
    function checkFormValidity(form, submitBtn) {
        if (!submitBtn) return;

        const allValid = Array.from(form.querySelectorAll('input[required], select[required]'))
            .every(input => {
                const formGroup = input.closest('.form-group, .form-check');
                return formGroup?.classList.contains('valid');
            });

        submitBtn.disabled = !allValid;
    }

    // تهيئة التحقق لكل النماذج
    setupValidation('loginForm');
    setupValidation('registerForm');

    // منع إرسال النموذج إذا كان غير صالح
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn.disabled) {
                e.preventDefault();
            }
        });
    });
});
