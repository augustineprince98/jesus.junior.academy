import { useEffect, useCallback } from 'react';
import { useAuthStore, useAcademicYearStore } from '@/store/useStore';
import { Calendar, ChevronDown } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://jja-backend.onrender.com';

interface YearSelectorProps {
    /** If provided, uses controlled mode instead of global store */
    selectedYearId?: number | null;
    /** If provided, uses controlled mode instead of global store */
    onChange?: (yearId: number) => void;
    className?: string;
    compact?: boolean;
}

export default function YearSelector({ selectedYearId: controlledYearId, onChange, className = '', compact = false }: YearSelectorProps) {
    const { token, isAuthenticated } = useAuthStore();
    const store = useAcademicYearStore();

    // Determine if using controlled or store mode
    const isControlled = controlledYearId !== undefined && onChange !== undefined;
    const activeYearId = isControlled ? controlledYearId : store.selectedYearId;

    const loadYears = useCallback(async () => {
        if (!token) return;
        try {
            store.setLoading(true);
            const response = await fetch(`${API_BASE}/academic-years/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                const sortedYears = (data || []).sort((a: any, b: any) =>
                    b.year.localeCompare(a.year)
                );
                store.setYears(sortedYears);

                // Auto-select current year if none selected
                if (sortedYears.length > 0) {
                    const currentYear = sortedYears.find((y: any) => y.is_current);
                    const defaultId = currentYear ? currentYear.id : sortedYears[0].id;

                    if (!store.selectedYearId) {
                        store.setSelectedYearId(defaultId);
                    }
                    // Also sync controlled mode on first load
                    if (isControlled && !controlledYearId) {
                        onChange(defaultId);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load academic years:', err);
        } finally {
            store.setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (isAuthenticated && store.years.length === 0) {
            loadYears();
        } else if (isAuthenticated && isControlled && !controlledYearId && store.years.length > 0) {
            // If years already loaded but controlled mode has no value, sync it
            const currentYear = store.years.find((y) => y.is_current);
            onChange(currentYear ? currentYear.id : store.years[0].id);
        }
    }, [isAuthenticated, store.years.length, loadYears]);

    const handleChange = (yearId: number) => {
        if (isControlled) {
            onChange(yearId);
        }
        // Always update the store so the header stays in sync
        store.setSelectedYearId(yearId);
    };

    if (store.loading && store.years.length === 0) {
        return (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white ${className}`}>
                <Calendar className="w-4 h-4 text-gray-400" />
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
        );
    }

    if (store.years.length === 0) return null;

    return (
        <div className={`relative ${className}`}>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm hover:border-blue-400 transition-colors">
                <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <select
                    value={activeYearId || ''}
                    onChange={(e) => handleChange(Number(e.target.value))}
                    className="bg-transparent border-none text-sm font-semibold text-gray-700 focus:ring-0 cursor-pointer pr-6 outline-none appearance-none w-full"
                >
                    {store.years.map((year) => (
                        <option key={year.id} value={year.id}>
                            {year.year} {year.is_current ? '(Current)' : ''}
                        </option>
                    ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 pointer-events-none -ml-5" />
            </div>
        </div>
    );
}
