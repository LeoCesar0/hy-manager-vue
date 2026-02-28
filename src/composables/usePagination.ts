import type { IPaginationBody } from "~/@types/pagination";
import { useRouteQuery } from '@vueuse/router'



type IProps = {} & Omit<IPaginationBody, 'page'>


export const usePagination = ({ limit, orderBy }: IProps) => {

    const page = useRouteQuery('page', 1, { transform: Number })

    const paginationBody = ref<IPaginationBody>({
        page: page.value,
        limit,
        orderBy,
    })

    watch(() => paginationBody.value.page, (newPage) => {
        page.value = newPage
    })

    return {
        paginationBody,
    }
};

