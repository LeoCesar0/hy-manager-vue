<script setup lang='ts'>
import type { IBankAccount } from '~/@schemas/models/bank-account';
import BankAccountForm from './BankAccountForm.vue';
import { useVModel } from '@vueuse/core';

type Props = {
    isOpen: boolean;
    initialValues: IBankAccount | null;
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
                    Editar Conta
                </UiSheetTitle>
                <UiSheetDescription>
                    Edite as informações da conta bancária
                </UiSheetDescription>
            </UiSheetHeader>
            <UiSheetBody>
                <BankAccountForm v-if="initialValues" :initial-values="initialValues" @success="onSuccess"
                    @cancel="onCancel" :is-edit-mode="true" />
            </UiSheetBody>
        </UiSheetContent>
    </UiSheet>
</template>
