"use server";
import { UserRole } from "@/lib/generated/prisma/enums";
// prisma db

// prisma data
import {  getSetting } from "./settings";

type Employee = {
  id: number;
  name: string;
  userId: string;
  telegramId: string;
  role: UserRole;
};

// get owners current count & increment on it
export const getEmployeeInfo = async () => {
  try {
    // get all settings
    const employees = await getSetting<Employee[]>("employees", "info");

    // create one if not exist
    if (!employees)
      // return default values
      return null;

    // return settings
    return employees;
  } catch {
    return null;
  }
};

// Normalize roles to uppercase trimmed string for safe comparison
const normalizeRole = (role: string | UserRole) =>
  role.toString().trim().toUpperCase();

// Get all employees by role (case-insensitive)
export const getEmployeesByRole = async (role: UserRole | string) => {
  // employees
  const employees = await getEmployeeInfo();
  // validate
  if (!employees) return [];
  // return
  const targetRole = normalizeRole(role);
  return employees.filter((emp) => normalizeRole(emp.role) === targetRole);
};

// Get all telegram IDs for employees with role SERVICE
export const getServiceTelegramIds = async (role: string) => {
  // employees
  const employees = await getEmployeeInfo();
  // validate
  if (!employees) return [];
  // return  const targetRole = normalizeRole(role);
  return employees
    .filter((emp) => normalizeRole(emp.role) === role)
    .map((emp) => emp.telegramId);
};
