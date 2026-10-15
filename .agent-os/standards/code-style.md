# Code Style Guide

## Context

Code Style Guide - HCI Study Design Platform
Context
Global code style rules for HCI Study Design web application (Next.js/React + NestJS/TypeScript).
<conditional-block context-check="general-formatting">
IF this General Formatting section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using General Formatting rules already in context"
ELSE:
  READ: The following formatting rules
General Formatting
Indentation

Use 2 spaces for indentation (TypeScript/JavaScript convention)
Never use tabs
Maintain consistent indentation throughout files
Align chained method calls vertically for readability

Line Length

Aim for 80-100 characters per line
Break long lines at logical points (after operators, before method calls)
Use Prettier to enforce consistent formatting

Naming Conventions
Variables and Functions

Use camelCase: userProfile, calculateScore, isLoading
Boolean variables: prefix with is, has, should, can
Event handlers: prefix with handle or on

typescriptconst isAuthenticated = true
const hasPermission = checkPermission()
const handleSubmit = () => {}
const onUserClick = () => {}
Types and Interfaces

Use PascalCase: UserProfile, ProjectData, PersonaFormValues
Interfaces: no I prefix (just User, not IUser)
Type aliases: descriptive names ending in Type only when needed for clarity

typescriptinterface User {
  id: string
  name: string
}