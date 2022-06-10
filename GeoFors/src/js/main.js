jQuery(document).ready(function(){
	var modalTriggerBts = $('a[data-type="cd-modal-trigger"]'),
		coverLayer = $('.cd-cover-layer');
	
	/*
		convert a cubic bezier value to a custom mina easing
		http://stackoverflow.com/questions/25265197/how-to-convert-a-cubic-bezier-value-to-a-custom-mina-easing-snap-svg
	*/
	var duration = 600,
		epsilon = (1000 / 60 / duration) / 4,
		firstCustomMinaAnimation = bezier(.63,.35,.48,.92, epsilon);

	modalTriggerBts.each(function(){
		initModal($(this));
	});

	function initModal(modalTrigger) {
		var modalTriggerId =  modalTrigger.attr('id'),
			modal = $('.cd-modal[data-modal="'+ modalTriggerId +'"]'),
			svgCoverLayer = modal.children('.cd-svg-bg'),
			paths = svgCoverLayer.find('path'),
			pathsArray = [];
		//store Snap objects
		pathsArray[0] = Snap('#'+paths.eq(0).attr('id')),
		pathsArray[1] = Snap('#'+paths.eq(1).attr('id')),
		pathsArray[2] = Snap('#'+paths.eq(2).attr('id'));

		//store path 'd' attribute values	
		var pathSteps = [];
		pathSteps[0] = svgCoverLayer.data('step1');
		pathSteps[1] = svgCoverLayer.data('step2');
		pathSteps[2] = svgCoverLayer.data('step3');
		pathSteps[3] = svgCoverLayer.data('step4');
		pathSteps[4] = svgCoverLayer.data('step5');
		pathSteps[5] = svgCoverLayer.data('step6');
		
		//open modal window
		modalTrigger.on('click', function(event){
			event.preventDefault();
			modal.addClass('modal-is-visible');
			coverLayer.addClass('modal-is-visible');
			animateModal(pathsArray, pathSteps, duration, 'open');
		});

		//close modal window
		modal.on('click', '.modal-close', function(event){
			event.preventDefault();
			modal.removeClass('modal-is-visible');
			coverLayer.removeClass('modal-is-visible');
			animateModal(pathsArray, pathSteps, duration, 'close');
		});
	}

	function animateModal(paths, pathSteps, duration, animationType) {
		var path1 = ( animationType == 'open' ) ? pathSteps[1] : pathSteps[0],
			path2 = ( animationType == 'open' ) ? pathSteps[3] : pathSteps[2],
			path3 = ( animationType == 'open' ) ? pathSteps[5] : pathSteps[4];
		paths[0].animate({'d': path1}, duration, firstCustomMinaAnimation);
		paths[1].animate({'d': path2}, duration, firstCustomMinaAnimation);
		paths[2].animate({'d': path3}, duration, firstCustomMinaAnimation);
	}

	function bezier(x1, y1, x2, y2, epsilon){
		//https://github.com/arian/cubic-bezier
		var curveX = function(t){
			var v = 1 - t;
			return 3 * v * v * t * x1 + 3 * v * t * t * x2 + t * t * t;
		};

		var curveY = function(t){
			var v = 1 - t;
			return 3 * v * v * t * y1 + 3 * v * t * t * y2 + t * t * t;
		};

		var derivativeCurveX = function(t){
			var v = 1 - t;
			return 3 * (2 * (t - 1) * t + v * v) * x1 + 3 * (- t * t * t + 2 * v * t) * x2;
		};

		return function(t){

			var x = t, t0, t1, t2, x2, d2, i;

			// First try a few iterations of Newton's method -- normally very fast.
			for (t2 = x, i = 0; i < 8; i++){
				x2 = curveX(t2) - x;
				if (Math.abs(x2) < epsilon) return curveY(t2);
				d2 = derivativeCurveX(t2);
				if (Math.abs(d2) < 1e-6) break;
				t2 = t2 - x2 / d2;
			}

			t0 = 0, t1 = 1, t2 = x;

			if (t2 < t0) return curveY(t0);
			if (t2 > t1) return curveY(t1);

			// Fallback to the bisection method for reliability.
			while (t0 < t1){
				x2 = curveX(t2);
				if (Math.abs(x2 - x) < epsilon) return curveY(t2);
				if (x > x2) t0 = t2;
				else t1 = t2;
				t2 = (t1 - t0) * .5 + t0;
			}

			// Failure
			return curveY(t2);

		};
	};
});




    'use strict';
    var slider = (function (config) {

      const ClassName = {
        INDICATOR_ACTIVE: 'slider__indicator_active',
        ITEM: 'slider__item',
        ITEM_LEFT: 'slider__item_left',
        ITEM_RIGHT: 'slider__item_right',
        ITEM_PREV: 'slider__item_prev',
        ITEM_NEXT: 'slider__item_next',
        ITEM_ACTIVE: 'slider__item_active'
      }

      var
        _isSliding = false, // индикация процесса смены слайда
        _interval = 0, // числовой идентификатор таймера
        _transitionDuration = 700, // длительность перехода
        _slider = {}, // DOM элемент слайдера
        _items = {}, // .slider-item (массив слайдов) 
        _sliderIndicators = {}, // [data-slide-to] (индикаторы)
        _config = {
          selector: '', // селектор слайдера
          isCycling: true, // автоматическая смена слайдов
          direction: 'next', // направление смены слайдов
          interval: 5000, // интервал между автоматической сменой слайдов
          pause: true // устанавливать ли паузу при поднесении курсора к слайдеру
        };

      var
        // функция для получения порядкового индекса элемента
        _getItemIndex = function (_currentItem) {
          var result;
          _items.forEach(function (item, index) {
            if (item === _currentItem) {
              result = index;
            }
          });
          return result;
        },
        // функция для подсветки активного индикатора
        _setActiveIndicator = function (_activeIndex, _targetIndex) {
          if (_sliderIndicators.length !== _items.length) {
            return;
          }
          _sliderIndicators[_activeIndex].classList.remove(ClassName.INDICATOR_ACTIVE);
          _sliderIndicators[_targetIndex].classList.add(ClassName.INDICATOR_ACTIVE);
        },

        // функция для смены слайда
        _slide = function (direction, activeItemIndex, targetItemIndex) {
          var
            directionalClassName = ClassName.ITEM_RIGHT,
            orderClassName = ClassName.ITEM_PREV,
            activeItem = _items[activeItemIndex], // текущий элемент
            targetItem = _items[targetItemIndex]; // следующий элемент

          var _slideEndTransition = function () {
            activeItem.classList.remove(ClassName.ITEM_ACTIVE);
            activeItem.classList.remove(directionalClassName);
            targetItem.classList.remove(orderClassName);
            targetItem.classList.remove(directionalClassName);
            targetItem.classList.add(ClassName.ITEM_ACTIVE);
            window.setTimeout(function () {
              if (_config.isCycling) {
                clearInterval(_interval);
                _cycle();
              }
              _isSliding = false;
              activeItem.removeEventListener('transitionend', _slideEndTransition);
            }, _transitionDuration);
          };

          if (_isSliding) {
            return; // завершаем выполнение функции если идёт процесс смены слайда
          }
          _isSliding = true; // устанавливаем переменной значение true (идёт процесс смены слайда)

          if (direction === "next") { // устанавливаем значение классов в зависимости от направления
            directionalClassName = ClassName.ITEM_LEFT;
            orderClassName = ClassName.ITEM_NEXT;
          }

          targetItem.classList.add(orderClassName); // устанавливаем положение элемента перед трансформацией
          _setActiveIndicator(activeItemIndex, targetItemIndex); // устанавливаем активный индикатор

          window.setTimeout(function () { // запускаем трансформацию
            targetItem.classList.add(directionalClassName);
            activeItem.classList.add(directionalClassName);
            activeItem.addEventListener('transitionend', _slideEndTransition);
          }, 0);

        },
        // функция для перехода к предыдущему или следующему слайду
        _slideTo = function (direction) {
          var
            activeItem = _slider.querySelector('.' + ClassName.ITEM_ACTIVE), // текущий элемент
            activeItemIndex = _getItemIndex(activeItem), // индекс текущего элемента 
            lastItemIndex = _items.length - 1, // индекс последнего элемента
            targetItemIndex = activeItemIndex === 0 ? lastItemIndex : activeItemIndex - 1;
          if (direction === "next") { // определяем индекс следующего слайда в зависимости от направления
            targetItemIndex = activeItemIndex == lastItemIndex ? 0 : activeItemIndex + 1;
          }
          _slide(direction, activeItemIndex, targetItemIndex);
        },
        // функция для запуска автоматической смены слайдов в указанном направлении
        _cycle = function () {
          if (_config.isCycling) {
            _interval = window.setInterval(function () {
              _slideTo(_config.direction);
            }, _config.interval);
          }
        },
        // обработка события click
        _actionClick = function (e) {
          var
            activeItem = _slider.querySelector('.' + ClassName.ITEM_ACTIVE), // текущий элемент
            activeItemIndex = _getItemIndex(activeItem), // индекс текущего элемента
            targetItemIndex = e.target.getAttribute('data-slide-to');

          if (!(e.target.hasAttribute('data-slide-to') || e.target.classList.contains('slider__control'))) {
            return; // завершаем если клик пришёлся на не соответствующие элементы
          }
          if (e.target.hasAttribute('data-slide-to')) {// осуществляем переход на указанный сдайд 
            if (activeItemIndex === targetItemIndex) {
              return;
            }
            _slide((targetItemIndex > activeItemIndex) ? 'next' : 'prev', activeItemIndex, targetItemIndex);
          } else {
            e.preventDefault();
            _slideTo(e.target.classList.contains('slider__control_next') ? 'next' : 'prev');
          }
        },
        // установка обработчиков событий
        _setupListeners = function () {
          // добавление к слайдеру обработчика события click
          _slider.addEventListener('click', _actionClick);
          // остановка автоматической смены слайдов (при нахождении курсора над слайдером)
          if (_config.pause && _config.isCycling) {
            _slider.addEventListener('mouseenter', function (e) {
              clearInterval(_interval);
            });
            _slider.addEventListener('mouseleave', function (e) {
              clearInterval(_interval);
              _cycle();
            });
          }
        };

      // init (инициализация слайдера)
      for (var key in config) {
        if (key in _config) {
          _config[key] = config[key];
        }
      }
      _slider = (typeof _config.selector === 'string' ? document.querySelector(_config.selector) : _config.selector);
      _items = _slider.querySelectorAll('.' + ClassName.ITEM);
      _sliderIndicators = _slider.querySelectorAll('[data-slide-to]');
      // запуск функции cycle
      _cycle();
      _setupListeners();

      return {
        next: function () { // метод next 
          _slideTo('next');
        },
        prev: function () { // метод prev 
          _slideTo('prev');
        },
        stop: function () { // метод stop
          clearInterval(_interval);
        },
        cycle: function () { // метод cycle 
          clearInterval(_interval);
          _cycle();
        }
      }
    }({
      selector: '.slider',
      isCycling: false,
      direction: 'next',
      interval: 5000,
      pause: true
    }));
