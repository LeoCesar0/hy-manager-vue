import {
  ArrowLeftRightIcon,
  FolderIcon,
  BarChart3Icon,
  LandmarkIcon,
  UserPlusIcon,
  SettingsIcon,
  LineChartIcon,
} from "lucide-vue-next";

export const APP_NAME = "HyManager";
export const APP_DESCRIPTION =
  "Organize suas finanças pessoais de forma simples e inteligente.";

export const LANDING_HERO = {
  title: "Suas finanças no controle,",
  titleHighlight: "sem complicação.",
  subtitle:
    "Acompanhe transações, categorize gastos e visualize relatórios — tudo em um só lugar.",
  ctaPrimary: "Comece grátis",
  ctaSecondary: "Entrar",
} as const;

export const LANDING_FEATURES = {
  sectionTitle: "Tudo que você precisa",
  sectionSubtitle:
    "Ferramentas simples e poderosas para organizar sua vida financeira.",
  items: [
    {
      icon: ArrowLeftRightIcon,
      title: "Transações",
      description:
        "Registre receitas e despesas com facilidade. Importe extratos ou adicione manualmente.",
    },
    {
      icon: FolderIcon,
      title: "Categorias",
      description:
        "Organize seus gastos em categorias personalizadas e entenda para onde vai seu dinheiro.",
    },
    {
      icon: BarChart3Icon,
      title: "Relatórios",
      description:
        "Visualize gráficos e resumos que mostram a saúde das suas finanças em tempo real.",
    },
    {
      icon: LandmarkIcon,
      title: "Contas Bancárias",
      description:
        "Gerencie múltiplas contas e acompanhe o saldo de cada uma separadamente.",
    },
  ],
} as const;

export const LANDING_HOW_IT_WORKS = {
  sectionTitle: "Como funciona",
  sectionSubtitle: "Três passos simples para assumir o controle das suas finanças.",
  steps: [
    {
      icon: UserPlusIcon,
      number: 1,
      title: "Cadastre-se",
      description: "Crie sua conta gratuita em segundos com email ou Google.",
    },
    {
      icon: SettingsIcon,
      number: 2,
      title: "Configure",
      description:
        "Adicione suas contas bancárias e personalize suas categorias.",
    },
    {
      icon: LineChartIcon,
      number: 3,
      title: "Controle",
      description:
        "Registre transações, acompanhe gastos e tome decisões mais inteligentes.",
    },
  ],
} as const;

export const LANDING_CTA = {
  title: "Pronto para organizar suas finanças?",
  subtitle:
    "Comece agora e tenha uma visão clara de para onde vai cada centavo.",
  button: "Comece grátis",
} as const;

export const LANDING_FOOTER = {
  description:
    "Gestão financeira pessoal simples e inteligente.",
  sections: [
    {
      title: "Produto",
      links: [
        { label: "Funcionalidades", href: "#features" },
        { label: "Como funciona", href: "#how-it-works" },
      ],
    },
  ],
  copyright: `© ${new Date().getFullYear()} ${APP_NAME}. Todos os direitos reservados.`,
} as const;

export const AUTH_COPY = {
  signIn: {
    title: "Bem-vindo de volta",
    subtitle: "Entre na sua conta para continuar",
    submitButton: "Entrar",
    googleButton: "Entrar com Google",
    separator: "Ou continue com",
    forgotPassword: "Esqueceu sua senha?",
    noAccount: "Não tem uma conta?",
    createAccount: "Criar conta",
  },
  signUp: {
    title: "Crie sua conta",
    subtitle: "Comece a organizar suas finanças agora",
    submitButton: "Criar conta",
    googleButton: "Criar conta com Google",
    separator: "Ou continue com",
    hasAccount: "Já tem uma conta?",
    signIn: "Entrar",
  },
  forgotPassword: {
    title: "Redefinir senha",
    subtitle: "Insira seu email para receber um link de redefinição",
    submitButton: "Enviar link",
    successMessage:
      "Link de redefinição enviado! Verifique sua caixa de entrada.",
    rememberPassword: "Lembrou sua senha?",
    signIn: "Entrar",
  },
  labels: {
    name: "Nome",
    email: "Email",
    password: "Senha",
    confirmPassword: "Confirmar senha",
  },
  placeholders: {
    name: "Seu nome",
    email: "seu@email.com",
    password: "Sua senha",
    confirmPassword: "Confirme sua senha",
  },
} as const;
