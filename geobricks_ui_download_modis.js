var root = '../modules/';

define(['jquery',
        'mustache',
        'text!' + root + 'geobricks_ui_download_modis/html/templates.html',
        'i18n!' + root + 'geobricks_ui_download_modis/nls/translate',
        'bootstrap'], function ($, Mustache, templates, translate) {

    'use strict';

    function UI_MODIS() {

        this.CONFIG = {
            lang:               'en',
            url_products:       'http://localhost:5555/browse/modis/',
            url_download:       'http://localhost:5555/download/modis/',
            url_countries:      'http://localhost:5555/browse/modis/countries/',
            placeholder_id:     'placeholder',
            url_browse_modis:   'http://localhost:5555/browse/modis/',
            days_of_the_month: {
                1: 31,
                32: 28,
                60: 31,
                91: 30,
                121: 31,
                152: 30,
                182: 31,
                213: 31,
                244: 30,
                274: 31,
                305: 30,
                335: 31
            },
            days_of_the_month_leap: {
                1: 31,
                32: 28,
                61: 31,
                92: 30,
                122: 31,
                153: 30,
                184: 31,
                214: 31,
                245: 30,
                275: 31,
                306: 30,
                336: 31
            }
        };

    }

    /**
     * This is the entry method to configure the module.
     *
     * @param config Custom configuration in JSON format to extend the default settings.
     */
    UI_MODIS.prototype.init = function(config) {

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        /* Fix the language, if needed. */
        this.CONFIG.lang = this.CONFIG.lang != null ? this.CONFIG.lang : 'en';

        /* Render the main structure. */
        var template = $(templates).filter('#main_structure').html();
        var view = {
            countries: translate.countries,
            products: translate.products,
            year: translate.year,
            from_date: translate.from_date,
            to_date: translate.to_date,
            please_select: translate.please_select
        };
        var render = Mustache.render(template, view);
        $('#' + this.CONFIG.placeholder_id).html(render);

        /* Cache JQuery selectors. */
        this.countries_selector = $('#countries_selector');
        this.products_selector = $('#products_selector');
        this.year_selector = $('#year_selector');
        this.from_date_selector = $('#from_date_selector');
        this.to_date_selector = $('#to_date_selector');

        /* Initiate Chosen drop-downs. */
        this.countries_selector.chosen({disable_search_threshold: 10});
        this.products_selector.chosen({disable_search_threshold: 10});
        this.year_selector.chosen({disable_search_threshold: 10});
        this.from_date_selector.chosen({disable_search_threshold: 10});
        this.to_date_selector.chosen({disable_search_threshold: 10});

        /* Populate countries. */
        this.populate_countries();

        /* Populate drop-downs. **/
        this.populate_products();

    };

    UI_MODIS.prototype.populate_countries = function() {

        /* This. */
        var _this = this;

        /* Fill data source list and initialize Chosen. */
        $.ajax({

            type: 'GET',
            url: this.CONFIG.url_countries,

            success: function (response) {

                /* Cast the response to JSON, if needed. */
                var json = response;
                if (typeof json == 'string')
                    json = $.parseJSON(response);

                /* Sort countries by label. */
                var countries = json.sort(function(a, b) {
                    return a.gaul_label > b.gaul_label;
                });

                /* Fill the drop-down. */
                var s = '';
                s += '<option value=""></option>';
                for (var i = 0 ; i < countries.length ; i++) {
                    s += '<option ';
                    s += 'data-gaul="' + countries[i].gaul_code + '" ';
                    s += 'data-iso2="' + countries[i].iso2_code + '" ';
                    s += 'data-iso3="' + countries[i].iso3_code + '" ';
                    s += '>';
                    s += countries[i].gaul_label;
                    s += '</option>';
                }

                /* Trigger Chosen. */
                _this.countries_selector.html(s).trigger('chosen:updated');
                $('#countries_label').html(translate.countries);

            }

        });

    };

    UI_MODIS.prototype.populate_products = function() {

        /* This. */
        var _this = this;

        /* Fill data source list and initialize Chosen. */
        $.ajax({

            type: 'GET',
            url: this.CONFIG.url_products,

            success: function (response) {

                /* Cast the response to JSON, if needed. */
                var json = response;
                if (typeof json == 'string')
                    json = $.parseJSON(response);

                /* Fill the drop-down. */
                var s = '';
                s += '<option value=""></option>';
                for (var i = 0 ; i < json.length ; i++) {
                    s += '<option ';
                    s += 'value="' + json[i].code + '"';
                    s += 'data-temporal="' + json[i].temporal_resolution + '"';
                    s += 'data-spatial="' + json[i].spatial_resolution + '"';
                    s += '>';
                    s += json[i].label;
                    s += '</option>';
                }

                /* Trigger Chosen. */
                _this.products_selector.html(s).trigger('chosen:updated').change(function() {
                    _this.populate_years();
                });
                $('#products_label').html(translate.products);

            }

        });
    };

    UI_MODIS.prototype.populate_years = function() {

        /* This. */
        var _this = this;

        /* Fetch selected product. */
        var product = this.products_selector.find('option:selected').val();

        /* Fill data source list and initialize Chosen. */
        $.ajax({

            type: 'GET',
            url: this.CONFIG.url_products + product + '/',

            success: function (response) {

                /* Cast the response to JSON, if needed. */
                var json = response;
                if (typeof json == 'string')
                    json = $.parseJSON(response);

                /* Fill the drop-down. */
                var s = '';
                s += '<option value=""></option>';
                for (var i = 0 ; i < json.length ; i++) {
                    s += '<option ';
                    s += 'value="' + json[i].code + '">';
                    s += json[i].label;
                    s += '</option>';
                }

                /* Trigger Chosen. */
                _this.year_selector.html(s).trigger('chosen:updated').change(function() {
                    _this.populate_dates();
                });
                $('#year_label').html(translate.year);

            }

        });
    };

    UI_MODIS.prototype.populate_dates = function() {

        /* This. */
        var _this = this;

        /* Fetch selected product. */
        var product = this.products_selector.find('option:selected').val();
        var year = this.year_selector.find('option:selected').val();

        /* Fill data source list and initialize Chosen. */
        $.ajax({

            type: 'GET',
            url: this.CONFIG.url_products + product + '/' + year + '/',

            success: function (response) {

                /* Cast the response to JSON, if needed. */
                var json = response;
                if (typeof json == 'string')
                    json = $.parseJSON(response);

                /* Fill the drop-down. */
                var s = '';
                s += '<option value=""></option>';
                for (var i = 0 ; i < json.length ; i++) {
                    s += '<option ';
                    s += 'value="' + json[i].code + '">';
                    s += json[i].label;
                    s += '</option>';
                }

                /* Trigger Chosen. */
                _this.from_date_selector.html(s).trigger('chosen:updated');
                _this.to_date_selector.html(s).trigger('chosen:updated');
                $('#from_date_label').html(translate.from_date);
                $('#to_date_label').html(translate.to_date);

            }

        });
    };

    UI_MODIS.prototype.download = function() {

        /* Create the URL's to fetch MODIS layers. */
        var urls = this.create_modis_urls();

        for (var i = 0 ; i < urls.length ; i++) {
            console.debug(urls[i]);
        }

    };

    UI_MODIS.prototype.create_modis_urls = function() {

        /* Initiate the output. */
        var urls = [];

        /* Collect user's selection. */
        var countries = this.countries_selector.find('option:selected');
        var gauls = [];
        for (var i = 0 ; i < countries.length ; i++)
            gauls.push($(countries[i]).data('gaul'));
        var product = this.products_selector.val();
        var year = this.year_selector.val();
        var tmp_from_date = this.from_date_selector.val();
        var tmp_to_date = this.to_date_selector.val();

        /* Fix errors, if any. */
        var from_date = parseInt(tmp_to_date) < parseInt(tmp_from_date) ? tmp_to_date : tmp_from_date;
        var to_date = parseInt(tmp_to_date) < parseInt(tmp_from_date) ? tmp_from_date : tmp_to_date;

        /* create the URL's according to the temporal resolution. */
        var temporal_resolution = $(this.products_selector.find('option:selected')).data('temporal');
        switch (temporal_resolution) {
            case 'Yearly':
                var url = this.CONFIG.url_browse_modis + product + '/' + year + '/' + from_date + '/' + gauls.join(',');
                urls.push(url);
                break;
            case '16 day':
                for (i = parseInt(from_date) ; i <= parseInt(to_date) ; i += 16)
                    urls.push(this.create_modis_url(product, year, i, gauls));
                break;
            case '8 day':
                for (i = parseInt(from_date) ; i <= parseInt(to_date) ; i += 8)
                    urls.push(this.create_modis_url(product, year, i, gauls));
                break;
            case '4 day':
                for (i = parseInt(from_date) ; i <= parseInt(to_date) ; i += 4)
                    urls.push(this.create_modis_url(product, year, i, gauls));
                break;
            case 'Daily':
                for (i = parseInt(from_date) ; i <= parseInt(to_date) ; i++)
                    urls.push(this.create_modis_url(product, year, i, gauls));
                break;
            case 'Monthly':
                if (parseInt(year) % 4 != 0) {
                    for (i = parseInt(from_date) ; i <= parseInt(to_date) ; i += this.CONFIG.days_of_the_month[i])
                        urls.push(this.create_modis_url(product, year, i, gauls));
                } else {
                    for (i = parseInt(from_date) ; i <= parseInt(to_date) ; i += this.CONFIG.days_of_the_month_leap[i])
                        urls.push(this.create_modis_url(product, year, i, gauls));
                }
                break;
        }

        /* Return the output. */
        return urls;
    };

    UI_MODIS.prototype.create_modis_url = function(product, year, day_of_the_year, gauls) {
        var s = '';
        s += this.CONFIG.url_browse_modis + product + '/' + year + '/';
        if (day_of_the_year < 10)
            s += '00' + day_of_the_year;
        else if (day_of_the_year >= 10 && day_of_the_year < 100)
            s += '0' + day_of_the_year;
        else
            s += day_of_the_year;
        s += '/' + gauls.join(',');
        return s;
    };

    return new UI_MODIS();

});
