// ===== Регион танлаш UI =====
const RegionsUI = {
    selectedCountry: null,
    selectedRegion: null,

    init() {
        document.getElementById('regionSaveBtn')?.addEventListener('click', () => this.save());

        // Давлат танлаш
        const select = document.getElementById('countrySelect');
        if (select) {
            // Давлатлар рўйхатини тўлдириш
            Object.keys(Regions.COUNTRIES).forEach(code => {
                const opt = document.createElement('option');
                opt.value = code;
                opt.textContent = Regions.getCountryFlag(code) + ' ' + Regions.getCountryName(code);
                select.appendChild(opt);
            });

            // Ўзгариш
            select.addEventListener('change', () => {
                this.selectedCountry = select.value;
                this.renderRegions();
            });

            // Бошланғич
            if (select.options.length > 1) {
                select.selectedIndex = 1;  // Ўзбекистон
                this.selectedCountry = select.value;
                this.renderRegions();
            }
        }
    },

    renderRegions() {
        const select = document.getElementById('regionSelect');
        if (!select) return;
        select.innerHTML = '';
        const list = Regions.getRegionsList(this.selectedCountry);
        list.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r;
            opt.textContent = r;
            select.appendChild(opt);
        });
    },

    open() {
        showScreen('regionScreen');
    },

    save() {
        const countrySelect = document.getElementById('countrySelect');
        const regionSelect = document.getElementById('regionSelect');
        if (!countrySelect || !regionSelect) return;

        const countryCode = countrySelect.value;
        const region = regionSelect.value;

        if (!countryCode || !region) {
            alert('Илтимос, мамлакат ва вилоятни танланг!');
            return;
        }

        Regions.saveRegion(countryCode, region);
        console.log('✅ Регион сақланди:', countryCode, region);

        // Firebase'га янгилаш
        if (FirebaseDB.isReady && TelegramAuth.user) {
            FirebaseDB.saveUser(TelegramAuth.user);
        }

        // Менюга қайтиш
        showScreen('zonesScreen');
    }
};

console.log('✅ regionsUI.js юкланди');
