import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        view: 'View',
        add: 'Add',
        search: 'Search',
        filter: 'Filter',
        export: 'Export',
        import: 'Import',
        loading: 'Loading...',
        noData: 'No data found',
        confirm: 'Confirm',
        yes: 'Yes',
        no: 'No',
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
      },
      auth: {
        login: 'Sign In',
        logout: 'Sign Out',
        email: 'Email',
        password: 'Password',
        forgotPassword: 'Forgot Password?',
        resetPassword: 'Reset Password',
      },
      dashboard: {
        title: 'Dashboard',
        welcome: 'Welcome back',
        stats: 'Statistics',
        activity: 'Recent Activity',
      },
      navigation: {
        dashboard: 'Dashboard',
        users: 'Users',
        roles: 'Roles',
        modules: 'Modules',
        settings: 'Settings',
        profile: 'Profile',
      },
    },
  },
  ar: {
    translation: {
      common: {
        save: 'حفظ',
        cancel: 'إلغاء',
        delete: 'حذف',
        edit: 'تعديل',
        view: 'عرض',
        add: 'إضافة',
        search: 'بحث',
        filter: 'تصفية',
        export: 'تصدير',
        import: 'استيراد',
        loading: 'جاري التحميل...',
        noData: 'لا توجد بيانات',
      },
      auth: {
        login: 'تسجيل الدخول',
        logout: 'تسجيل الخروج',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
      },
      dashboard: {
        title: 'لوحة التحكم',
        welcome: 'مرحباً بعودتك',
      },
    },
  },
  es: {
    translation: {
      common: {
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        view: 'Ver',
        add: 'Agregar',
        search: 'Buscar',
        export: 'Exportar',
        import: 'Importar',
        loading: 'Cargando...',
        noData: 'Sin datos',
      },
      auth: {
        login: 'Iniciar sesión',
        logout: 'Cerrar sesión',
      },
      dashboard: {
        title: 'Panel de control',
        welcome: 'Bienvenido de nuevo',
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
