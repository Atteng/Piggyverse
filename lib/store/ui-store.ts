
import { create } from 'zustand';

interface ModalState {
    isOpen: boolean;
    type: 'host-tournament' | 'place-bet' | 'wallet-connect' | null;
    data?: any;
}

interface UiState {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (isOpen: boolean) => void;

    modal: ModalState;
    openModal: (type: ModalState['type'], data?: any) => void;
    closeModal: () => void;

    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const useUiStore = create<UiState>()((set) => ({
    isSidebarOpen: true, // Default open on desktop
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

    modal: { isOpen: false, type: null },
    openModal: (type, data) => set({ modal: { isOpen: true, type, data } }),
    closeModal: () => set({ modal: { isOpen: false, type: null, data: undefined } }),

    activeTab: 'overview',
    setActiveTab: (tab) => set({ activeTab: tab }),
}));
