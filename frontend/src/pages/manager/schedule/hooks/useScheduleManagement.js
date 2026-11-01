import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getShiftConfig } from "../../../../services/shiftConfigService";
import { subscribeSchedule } from "../../../../services/scheduleService";
import { autoScheduleORTools } from "../scheduleSolver";
import {
  employeeRoster,
  initialDays,
  initialConstraints,
  initialShiftDemands,
  getSavedSchedules,
  saveSchedules,
  confirmSchedule,
  isScheduleConfirmed,
  getShiftInfo,
  mergeConfigConstraints,
  mergeConfigShifts,
} from "../scheduleShared";

/**
 * Hook quản lý trạng thái, xếp lịch tự động (US11) và tương tác lịch làm việc (US12)
 */
export function useScheduleManagement() {
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState(null);
  const [constraints, setConstraints] = useState(initialConstraints);
  const [days, setDays] = useState(initialDays);
  const [shiftDemands, setShiftDemands] = useState(initialShiftDemands);
  const [schedules, setSchedules] = useState(getSavedSchedules);
  const [selectedShiftKey, setSelectedShiftKey] = useState("morning_T3");
  const [isConfirmedState, setIsConfirmedState] = useState(isScheduleConfirmed);

  useEffect(() => {
    return subscribeSchedule(() => {
      setSchedules(getSavedSchedules());
      setIsConfirmedState(isScheduleConfirmed());
    });
  }, []);

  const [editEmployeesList, setEditEmployeesList] = useState([]);
  const [showAddEmployeeDropdown, setShowAddEmployeeDropdown] = useState(false);
  const [weekendConfigured, setWeekendConfigured] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);

  // Tự động đồng bộ ca mẫu và ràng buộc từ module ShiftConfig
  useEffect(() => {
    getShiftConfig()
      .then((cfg) => {
        if (cfg?.constraints) setConstraints((prev) => mergeConfigConstraints(prev, cfg.constraints));
        if (cfg?.shifts) setShiftDemands((prev) => mergeConfigShifts(prev, cfg.shifts));
      })
      .catch((err) => console.warn("Could not load shift config, using defaults:", err));
  }, []);

  const selectedInfo = useMemo(
    () => getShiftInfo(schedules, shiftDemands, days, selectedShiftKey),
    [schedules, shiftDemands, days, selectedShiftKey]
  );

  const handleCellClick = (shiftId, dayId) => {
    setSelectedShiftKey(`${shiftId}_${dayId}`);
    setActiveModal("shiftDetail");
  };

  const handleOpenEditModal = () => {
    if (isConfirmedState) {
      alert("Lịch tuần này đã được xác nhận chính thức, không thể chỉnh sửa.");
      return;
    }
    setEditEmployeesList([...(schedules[selectedShiftKey]?.assigned || [])]);
    setShowAddEmployeeDropdown(false);
    setActiveModal("editShift");
  };

  const handleGoToOpenShift = (targetShift) => {
    setActiveModal(null);
    navigate("/manager/open-shifts", {
      state: { shift: targetShift || selectedInfo, fromSchedule: true },
    });
  };

  const toggleConstraint = (id) =>
    setConstraints((prev) => prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));

  const updateConstraintValue = (id, val) =>
    setConstraints((prev) => prev.map((c) => (c.id === id ? { ...c, value: val } : c)));

  const updateDemandField = (shiftId, field, delta) =>
    setShiftDemands((prev) =>
      prev.map((item) => {
        if (item.id !== shiftId) return item;
        const newVal = Math.max(0, item[field] + delta);
        const updated = { ...item, [field]: newVal };
        updated.total = updated.phucVu + updated.phaChe + updated.thuNgan;
        return updated;
      })
    );

  const toggleDay = (dayId) =>
    setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, active: !d.active } : d)));

  const handleCopyWeekendDemand = () => {
    setDays((prev) => prev.map((d) => (d.id === "T7" || d.id === "CN" ? { ...d, active: true } : d)));
    setWeekendConfigured(true);
  };

  const handleRemoveFromEditShift = (empId) =>
    setEditEmployeesList((prev) => prev.filter((e) => e.id !== empId));

  const handleAddEmployeeToEditShift = (emp) => {
    if (!editEmployeesList.some((e) => e.id === emp.id)) {
      setEditEmployeesList((prev) => [...prev, emp]);
    }
    setShowAddEmployeeDropdown(false);
  };

  const handleSaveEditShift = () => {
    if (isConfirmedState) {
      alert("Lịch tuần này đã được xác nhận chính thức, không thể chỉnh sửa.");
      setActiveModal(null);
      return;
    }
    setSchedules((prev) => {
      const next = { ...prev, [selectedShiftKey]: { ...prev[selectedShiftKey], assigned: editEmployeesList } };
      saveSchedules(next);
      return next;
    });
    setActiveModal(null);
  };

  const handleConfirmSchedule = () => {
    confirmSchedule(schedules);
    setIsConfirmedState(true);
    setActiveModal(null);
  };

  // US11: Xếp lịch tự động tôn trọng lịch rảnh (US08/US09)
  const handleRunORTools = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setSchedules((prev) => {
        const weekKey = days?.[0]?.iso;
        const next = autoScheduleORTools({ currentSchedules: prev, shiftDemands, employeeRoster, weekKey });
        saveSchedules(next);
        return next;
      });
      setIsGenerating(false);
      setGenerationSuccess(true);
      setTimeout(() => {
        setGenerationSuccess(false);
        setActiveModal(null);
      }, 900);
    }, 1500);
  };

  const uniqueEmployeesCount = useMemo(() => {
    const s = new Set();
    Object.values(schedules).forEach((shift) => shift.assigned?.forEach((e) => s.add(e.id)));
    return s.size || 26;
  }, [schedules]);

  return {
    activeModal, setActiveModal, constraints, days, shiftDemands, schedules,
    selectedShiftKey, isConfirmedState, editEmployeesList, showAddEmployeeDropdown,
    setShowAddEmployeeDropdown, weekendConfigured, isGenerating, generationSuccess,
    selectedInfo, uniqueEmployeesCount, employeeRoster, handleCellClick,
    handleOpenEditModal, handleGoToOpenShift, toggleConstraint, updateConstraintValue,
    updateDemandField, toggleDay, handleCopyWeekendDemand, handleCustomWeekendDemand: handleCopyWeekendDemand,
    handleRemoveFromEditShift, handleAddEmployeeToEditShift, handleSaveEditShift,
    handleConfirmSchedule, handleRunORTools,
  };
}
