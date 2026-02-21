<script setup lang='ts'>
import type { IBankAccount, ICreateBankAccount } from '~/@schemas/models/bank-account';
import BankAccountForm from './BankAccountForm.vue';
import { useVModel } from '@vueuse/core';

type Props = {
    isOpen: boolean;
    initialValues: ICreateBankAccount;
    onSuccess: () => void;
    onCancel: () => void;
};

const props = defineProps<Props>();

const open = useVModel(props, 'isOpen');

</script>

<template>
    <UiSheet v-model:open="open">
        <UiSheetContent class=" overflow-y-auto">
            <UiSheetHeader>
                <UiSheetTitle>
                    Nova Conta
                </UiSheetTitle>
                <UiSheetDescription>
                    Adicione uma nova conta bancária
                </UiSheetDescription>
            </UiSheetHeader>
            <UiSheetBody>
                <BankAccountForm v-if="initialValues" :initial-values="initialValues" @success="onSuccess"
                    @cancel="onCancel" :is-edit-mode="false" />
            </UiSheetBody>
        </UiSheetContent>
    </UiSheet>
</template>
