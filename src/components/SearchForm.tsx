import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Autocomplete,
    Grid,
    Typography,
    Switch,
    FormControlLabel,
    Paper,
    CircularProgress
} from '@mui/material';
import { api } from '../services/api';
import type { Place } from '../services/api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays } from 'date-fns';

interface SearchFormProps {
    onSearch: (params: any) => void;
    isLoading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading }) => {
    const [query, setQuery] = useState('');
    const [places, setPlaces] = useState<Place[]>([]);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [aiSearchMode, setAiSearchMode] = useState(false);
    const [checkin, setCheckin] = useState<Date | null>(addDays(new Date(), 7));
    const [checkout, setCheckout] = useState<Date | null>(addDays(new Date(), 9));
    const [adults, setAdults] = useState(2);

    const [searchLoading, setSearchLoading] = useState(false);

    // Debounce search for places
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query && query.length > 2 && !aiSearchMode) {
                setSearchLoading(true);
                try {
                    const results = await api.searchPlaces(query);
                    setPlaces(results);
                } catch (e) {
                    console.error(e);
                } finally {
                    setSearchLoading(false);
                }
            } else {
                setPlaces([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [query, aiSearchMode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkin || !checkout) return;

        const params: any = {
            checkin: format(checkin, 'yyyy-MM-dd'),
            checkout: format(checkout, 'yyyy-MM-dd'),
            adults: adults,
            // Simple occupancy logic: 1 room with N adults
            occupancies: [{ adults: adults, children: [] }]
        };

        if (aiSearchMode) {
            params.aiSearch = query;
        } else if (selectedPlace) {
            params.placeId = selectedPlace.placeId;
        } else if (query) {
            // Fallback if they typed something but didn't select, treat as AI search?
            params.aiSearch = query;
        } else {
            return; // Validation error
        }

        onSearch(params);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h5" gutterBottom>Find Your Perfect Stay</Typography>
                <Box component="form" onSubmit={handleSubmit}>
                    {/* Using Grid2 syntax (size prop) as item/xs props seem unsupported */}
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={aiSearchMode}
                                        onChange={(e) => setAiSearchMode(e.target.checked)}
                                    />
                                }
                                label={aiSearchMode ? "AI Search (Search by Vibe)" : "Standard Search (Location)"}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 5 }}>
                            {aiSearchMode ? (
                                <TextField
                                    fullWidth
                                    label="Describe your trip (e.g. 'Romantic getaway in Paris')"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    required
                                />
                            ) : (
                                <Autocomplete
                                    fullWidth
                                    options={places}
                                    loading={searchLoading}
                                    getOptionLabel={(option) => {
                                        if (typeof option === 'string') return option;
                                        return option.displayName || option.formattedAddress;
                                    }}
                                    filterOptions={(x) => x}
                                    value={(selectedPlace || query) as any}
                                    inputValue={query}
                                    isOptionEqualToValue={(option, value) => {
                                        if (typeof value === 'string') return option.displayName === value;
                                        if (typeof option === 'string') return option === value;
                                        return option.placeId === value.placeId;
                                    }}
                                    onChange={(_, newValue: string | Place | null) => {
                                        if (typeof newValue === 'string') {
                                            setSelectedPlace(null);
                                            setQuery(newValue);
                                        } else if (newValue) {
                                            setSelectedPlace(newValue);
                                            setQuery(newValue.displayName || newValue.formattedAddress);
                                        } else {
                                            setSelectedPlace(null);
                                            setQuery('');
                                        }
                                    }}
                                    onInputChange={(_, newInputValue, reason) => {
                                        if (reason === 'reset' && selectedPlace === null) {
                                            return;
                                        }
                                        setQuery(newInputValue);
                                        if (newInputValue === '') {
                                            setSelectedPlace(null);
                                        }
                                    }}
                                    renderOption={(props, option) => {
                                        const { key, ...otherProps } = props;
                                        return (
                                            <li key={option.placeId} {...otherProps}>
                                                <Grid container alignItems="center">
                                                    <Grid size={{ md: 'auto' }} sx={{ display: 'flex', width: 44 }}>
                                                        <Typography variant="body2" color="text.secondary">📍</Typography>
                                                    </Grid>
                                                    <Grid size={{ md: 'grow' }} sx={{ width: 'calc(100% - 44px)', wordWrap: 'break-word' }}>
                                                        <Box component="span" sx={{ fontWeight: 'bold' }}>
                                                            {option.displayName}
                                                        </Box>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {option.formattedAddress}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                            </li>
                                        );
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Destination"
                                            required={!selectedPlace}
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <React.Fragment>
                                                        {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </React.Fragment>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            )}
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                            <DatePicker
                                label="Check-in"
                                value={checkin}
                                onChange={(newValue) => setCheckin(newValue)}
                                slotProps={{ textField: { fullWidth: true, required: true } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <DatePicker
                                label="Check-out"
                                value={checkout}
                                onChange={(newValue) => setCheckout(newValue)}
                                slotProps={{ textField: { fullWidth: true, required: true } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 6, md: 1 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Adults"
                                value={adults}
                                onChange={(e) => setAdults(Number(e.target.value))}
                                inputProps={{ min: 1 }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={isLoading}
                            >
                                {isLoading ? 'Searching...' : 'Search Hotels'}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </LocalizationProvider>
    );
};

export default SearchForm;
