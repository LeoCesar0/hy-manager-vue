import  { 
  LayoutDashboardIcon, 
  ArrowLeftRightIcon, 
  FolderIcon, 
  UsersIcon, 
  WalletIcon 
} from "lucide-vue-next";

type AppIcon =  typeof LayoutDashboardIcon

export type IRoute = {
    path: (params?: any | undefined) => string;
    name:string,
    label:string,
    menu?:{
        icon:AppIcon,
        group: MenuGroup,
    }
}

export const MENU_GROUPS = [
    'overview',
    'management',
] as const

export type MenuGroup = typeof MENU_GROUPS[number]

export const MENU_GROUPS_LABELS: Record<MenuGroup, string> = {
    overview: 'Visão Geral',
    management: 'Gerenciamento',
} as const

export const ROUTES = [
    'home',
    'sign-in',
    'sign-up',
    'forgot-password',
    'dashboard',
    'onboarding',
    'transactions',
    'transactionId',
    'categories',
    'categoryId',
    'counterparties',
    'counterpartyId',
    'bankAccounts',
    'bankAccountId',
] as const
export type Route =  typeof ROUTES[number]

export const ROUTE = {
    home: {
        path: () => '/',
        name: 'home',
        label: 'Home',
    },
    'sign-in': {
        path: () => '/sign-in',
        name: 'sign-in',
        label: 'Sign In',
    },
    'sign-up': {
        path: () => '/sign-up',
        name: 'sign-up',
        label: 'Sign Up',
    },
    'forgot-password': {
        path: () => '/esqueci-minha-senha',
        name: 'forgot-password',
        label: 'Esquecei minha senha',
    },
    'onboarding': {
        path: () => '/onboarding',
        name: 'onboarding',
        label: 'Onboarding',
    },
    dashboard: {
        path: () => '/dashboard',
        name: 'dashboard',
        label: 'Dashboard',
        menu:{
            icon: LayoutDashboardIcon,
            group: 'overview',
        }
    },
    transactions: {
        path: () => '/dashboard/transacoes',
        name: 'transactions',
        label: 'Transações',
        menu:{
            icon: ArrowLeftRightIcon,
            group: 'management',
        }
    },
    transactionId: {
        path: (id: string) => `/dashboard/transacoes/${id}`,
        name: 'transactionId',
        label: 'Transação',
    },
    categories: {
        path: () => '/dashboard/categorias',
        name: 'categories',
        label: 'Categorias',
        menu:{
            icon: FolderIcon,
            group: 'management',
        }
    },
    categoryId: {
        path: (id: string) => `/dashboard/categorias/${id}`,
        name: 'categoryId',
        label: 'Categoria',
    },
    counterparties: {
        path: () => '/dashboard/terceiros',
        name: 'counterparties',
        label: 'Terceiros',
        menu:{
            icon: UsersIcon,
            group: 'management',
        }
    },
    counterpartyId: {
        path: (id: string) => `/dashboard/terceiros/${id}`,
        name: 'counterpartyId',
        label: 'Terceiro',
    },
    bankAccounts: {
        path: () => '/dashboard/contas-bancarias',
        name: 'bankAccounts',
        label: 'Contas Bancárias',
        menu:{
            icon: WalletIcon,
            group: 'management',
        }
    },
    bankAccountId: {
        path: (id: string) => `/dashboard/contas-bancarias/${id}`,
        name: 'bankAccountId',
        label: 'Conta Bancária',
    },
} satisfies Record<Route, IRoute>