// Компонент поиска и фильтрации

import React from 'react';
import {
    Stack, TextField, FormControl, InputLabel, Select, MenuItem,
    IconButton, Tooltip, Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import GroupIcon from '@mui/icons-material/Group';
import ViewListIcon from '@mui/icons-material/ViewList';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { theme } from '../styles/theme';

const SearchFilter = ({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    clientStatuses,
    hasActiveFilters,
    clearAllFilters,
    groupByStatus,
    setGroupByStatus,
    onAddClient
}) => {
    return (
        <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
                <TextField
                    label="Поиск клиентов"
                    placeholder="ФИО, телефон или email"
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ 
                        width: '300px',
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                        }
                    }}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ fontSize: 18, mr: 1, color: theme.colors.secondaryText }} />
                    }}
                />
                
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Фильтр по статусу</InputLabel>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="Фильтр по статусу"
                        sx={{
                            borderRadius: 2
                        }}
                        startAdornment={<FilterListIcon sx={{ fontSize: 18, mr: 1, color: theme.colors.secondaryText }} />}
                    >
                        <MenuItem value="">
                            <em>Все статусы</em>
                        </MenuItem>
                        {clientStatuses.map((status) => (
                            <MenuItem key={status.id} value={status.id}>
                                {status.status}
                            </MenuItem>
                        ))}
                        <MenuItem value="no_status">
                            <em>Без статуса</em>
                        </MenuItem>
                    </Select>
                </FormControl>
                
                {hasActiveFilters && (
                    <Tooltip title="Очистить фильтры">
                        <IconButton 
                            onClick={clearAllFilters}
                            size="small"
                            sx={{
                                backgroundColor: theme.colors.secondaryText + '10',
                                '&:hover': {
                                    backgroundColor: theme.colors.secondaryText + '20'
                                }
                            }}
                        >
                            <ClearIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                )}
            </Stack>
            
            <Stack direction="row" spacing={1}>
                <Tooltip title={groupByStatus ? "Обычный список" : "Группировка по статусам"}>
                    <Button
                        variant={groupByStatus ? "contained" : "outlined"}
                        size="small"
                        onClick={() => setGroupByStatus(!groupByStatus)}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            minWidth: 'auto',
                            px: 2
                        }}
                    >
                        {groupByStatus ? <GroupIcon sx={{ fontSize: 18 }} /> : <ViewListIcon sx={{ fontSize: 18 }} />}
                    </Button>
                </Tooltip>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PersonAddIcon sx={{ fontSize: 18 }} />}
                    onClick={onAddClient}
                    sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        minWidth: 160,
                        boxShadow: theme.shadows.button,
                        '&:hover': {
                            backgroundColor: theme.colors.accentDark
                        }
                    }}
                >
                    Добавить клиента
                </Button>
            </Stack>
        </Stack>
    );
};

export default SearchFilter;