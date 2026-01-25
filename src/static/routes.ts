import  { LayoutDashboardIcon, ListIcon, UserIcon } from "lucide-vue-next";

type AppIcon =  typeof UserIcon

export type IRoute = {
    path: (params?: any | undefined) => string;
    name:string,
    label:string, // Português do Brasil
    menu?:{
        icon:AppIcon,
    }
}

export const MENU_GROUPS = [
    'dashboard',
    'management',
] as const

export type MenuGroup = typeof MENU_GROUPS[number]

export const MENU_GROUPS_LABELS: Record<MenuGroup, string> = {
    dashboard: 'Dashboard',
    management: 'Gestão',
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
        }
    },
    transactions: {
        path: () => '/dashboard/transacoes',
        name: 'transactions',
        label: 'Transações',
        menu:{
            icon: ListIcon,
        }
    },
    transactionId: {
        path: (id: string) => `/dashboard/transacoes/${id}`,
        name: 'transactionId',
        label: 'Transação',
    },
} satisfies Record<Route, IRoute>