
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/App.svelte generated by Svelte v3.16.7 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (127:14) {:else}
    function create_else_block(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Edit Note";
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-info svelte-38bl1x");
    			add_location(button, file, 127, 16, 3222);
    			dispose = listen_dev(button, "click", prevent_default(/*updateNote*/ ctx[5]), false, true, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(127:14) {:else}",
    		ctx
    	});

    	return block;
    }

    // (120:14) {#if isEdit === false}
    function create_if_block(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Add Note";
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary svelte-38bl1x");
    			add_location(button, file, 120, 16, 2996);
    			dispose = listen_dev(button, "click", prevent_default(/*addNote*/ ctx[3]), false, true, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(120:14) {#if isEdit === false}",
    		ctx
    	});

    	return block;
    }

    // (141:8) {#each notes as note}
    function create_each_block(ctx) {
    	let div2;
    	let div0;
    	let t0_value = /*note*/ ctx[10].category + "";
    	let t0;
    	let t1;
    	let div1;
    	let h5;
    	let t2_value = /*note*/ ctx[10].title + "";
    	let t2;
    	let t3;
    	let p;
    	let t4_value = /*note*/ ctx[10].content + "";
    	let t4;
    	let t5;
    	let button0;
    	let t7;
    	let button1;
    	let t9;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			h5 = element("h5");
    			t2 = text(t2_value);
    			t3 = space();
    			p = element("p");
    			t4 = text(t4_value);
    			t5 = space();
    			button0 = element("button");
    			button0.textContent = "Edit";
    			t7 = space();
    			button1 = element("button");
    			button1.textContent = "Delete";
    			t9 = space();
    			attr_dev(div0, "class", "card-header svelte-38bl1x");
    			add_location(div0, file, 143, 12, 3603);
    			attr_dev(h5, "class", "card-title svelte-38bl1x");
    			add_location(h5, file, 145, 14, 3700);
    			attr_dev(p, "class", "card-text svelte-38bl1x");
    			add_location(p, file, 146, 14, 3755);
    			attr_dev(button0, "class", "btn btn-info svelte-38bl1x");
    			add_location(button0, file, 147, 14, 3809);
    			attr_dev(button1, "class", "btn btn-danger svelte-38bl1x");
    			add_location(button1, file, 151, 14, 3925);
    			attr_dev(div1, "class", "card-body svelte-38bl1x");
    			add_location(div1, file, 144, 12, 3662);
    			attr_dev(div2, "class", "card mb-3 svelte-38bl1x");
    			add_location(div2, file, 141, 10, 3566);

    			dispose = [
    				listen_dev(
    					button0,
    					"click",
    					function () {
    						if (is_function(/*editNote*/ ctx[4](/*note*/ ctx[10]))) /*editNote*/ ctx[4](/*note*/ ctx[10]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				),
    				listen_dev(
    					button1,
    					"click",
    					function () {
    						if (is_function(/*deleteNote*/ ctx[6](/*note*/ ctx[10].id))) /*deleteNote*/ ctx[6](/*note*/ ctx[10].id).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, h5);
    			append_dev(h5, t2);
    			append_dev(div1, t3);
    			append_dev(div1, p);
    			append_dev(p, t4);
    			append_dev(div1, t5);
    			append_dev(div1, button0);
    			append_dev(div1, t7);
    			append_dev(div1, button1);
    			append_dev(div2, t9);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*notes*/ 1 && t0_value !== (t0_value = /*note*/ ctx[10].category + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*notes*/ 1 && t2_value !== (t2_value = /*note*/ ctx[10].title + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*notes*/ 1 && t4_value !== (t4_value = /*note*/ ctx[10].content + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(141:8) {#each notes as note}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let section;
    	let div8;
    	let div7;
    	let div5;
    	let div4;
    	let div3;
    	let h5;
    	let t1;
    	let form;
    	let div0;
    	let label0;
    	let t3;
    	let input;
    	let t4;
    	let div1;
    	let label1;
    	let t6;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let t11;
    	let div2;
    	let label2;
    	let t13;
    	let textarea;
    	let t14;
    	let t15;
    	let div6;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*isEdit*/ ctx[2] === false) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);
    	let each_value = /*notes*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			div8 = element("div");
    			div7 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Add New Note";
    			t1 = space();
    			form = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Title";
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Category";
    			t6 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Selecet a category";
    			option1 = element("option");
    			option1.textContent = "School";
    			option2 = element("option");
    			option2.textContent = "Church";
    			option3 = element("option");
    			option3.textContent = "Home";
    			t11 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Content";
    			t13 = space();
    			textarea = element("textarea");
    			t14 = space();
    			if_block.c();
    			t15 = space();
    			div6 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h5, "class", "card-title mb-4 svelte-38bl1x");
    			add_location(h5, file, 87, 12, 1711);
    			attr_dev(label0, "for", "title");
    			attr_dev(label0, "class", "svelte-38bl1x");
    			add_location(label0, file, 90, 16, 1831);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control svelte-38bl1x");
    			attr_dev(input, "id", "text");
    			attr_dev(input, "placeholder", "Note Title");
    			add_location(input, file, 91, 16, 1880);
    			attr_dev(div0, "class", "form-group svelte-38bl1x");
    			add_location(div0, file, 89, 14, 1790);
    			attr_dev(label1, "for", "category");
    			attr_dev(label1, "class", "svelte-38bl1x");
    			add_location(label1, file, 99, 16, 2148);
    			option0.selected = true;
    			attr_dev(option0, "disaabled", "");
    			option0.__value = "Selecet a category";
    			option0.value = option0.__value;
    			attr_dev(option0, "class", "svelte-38bl1x");
    			add_location(option0, file, 104, 18, 2346);
    			option1.__value = "School";
    			option1.value = option1.__value;
    			attr_dev(option1, "class", "svelte-38bl1x");
    			add_location(option1, file, 105, 18, 2419);
    			option2.__value = "Church";
    			option2.value = option2.__value;
    			attr_dev(option2, "class", "svelte-38bl1x");
    			add_location(option2, file, 106, 18, 2476);
    			option3.__value = "Home";
    			option3.value = option3.__value;
    			attr_dev(option3, "class", "svelte-38bl1x");
    			add_location(option3, file, 107, 18, 2533);
    			attr_dev(select, "class", "form-control svelte-38bl1x");
    			attr_dev(select, "id", "category");
    			if (/*data*/ ctx[1].category === void 0) add_render_callback(() => /*select_change_handler*/ ctx[8].call(select));
    			add_location(select, file, 100, 16, 2203);
    			attr_dev(div1, "class", "form-group svelte-38bl1x");
    			add_location(div1, file, 98, 14, 2107);
    			attr_dev(label2, "for", "content");
    			attr_dev(label2, "class", "svelte-38bl1x");
    			add_location(label2, file, 111, 16, 2670);
    			attr_dev(textarea, "class", "form-control svelte-38bl1x");
    			attr_dev(textarea, "id", "content");
    			attr_dev(textarea, "rows", "3");
    			attr_dev(textarea, "placeholder", "Note Content");
    			add_location(textarea, file, 112, 16, 2723);
    			attr_dev(div2, "class", "form-group svelte-38bl1x");
    			add_location(div2, file, 110, 14, 2629);
    			attr_dev(form, "class", "svelte-38bl1x");
    			add_location(form, file, 88, 12, 1769);
    			attr_dev(div3, "class", "card-body svelte-38bl1x");
    			add_location(div3, file, 86, 10, 1675);
    			attr_dev(div4, "class", "card p-2 shadow svelte-38bl1x");
    			add_location(div4, file, 85, 8, 1635);
    			attr_dev(div5, "class", "col-md-6 svelte-38bl1x");
    			add_location(div5, file, 84, 6, 1604);
    			attr_dev(div6, "class", "col-md-6 svelte-38bl1x");
    			add_location(div6, file, 139, 6, 3503);
    			attr_dev(div7, "class", "row mt-5  svelte-38bl1x");
    			add_location(div7, file, 83, 4, 1574);
    			attr_dev(div8, "class", "container svelte-38bl1x");
    			add_location(div8, file, 82, 2, 1546);
    			attr_dev(section, "class", "svelte-38bl1x");
    			add_location(section, file, 81, 0, 1534);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    				listen_dev(select, "change", /*select_change_handler*/ ctx[8]),
    				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[9])
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, h5);
    			append_dev(div3, t1);
    			append_dev(div3, form);
    			append_dev(form, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, input);
    			set_input_value(input, /*data*/ ctx[1].title);
    			append_dev(form, t4);
    			append_dev(form, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t6);
    			append_dev(div1, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			select_option(select, /*data*/ ctx[1].category);
    			append_dev(form, t11);
    			append_dev(form, div2);
    			append_dev(div2, label2);
    			append_dev(div2, t13);
    			append_dev(div2, textarea);
    			set_input_value(textarea, /*data*/ ctx[1].content);
    			append_dev(form, t14);
    			if_block.m(form, null);
    			append_dev(div7, t15);
    			append_dev(div7, div6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div6, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data*/ 2 && input.value !== /*data*/ ctx[1].title) {
    				set_input_value(input, /*data*/ ctx[1].title);
    			}

    			if (dirty & /*data*/ 2) {
    				select_option(select, /*data*/ ctx[1].category);
    			}

    			if (dirty & /*data*/ 2) {
    				set_input_value(textarea, /*data*/ ctx[1].content);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(form, null);
    				}
    			}

    			if (dirty & /*deleteNote, notes, editNote*/ 81) {
    				each_value = /*notes*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div6, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if_block.d();
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let notes = [
    		{
    			id: 1,
    			title: "Sweetest framework ever",
    			category: "Church",
    			content: "This is the content of this note"
    		},
    		{
    			id: 2,
    			title: "intro to svelt",
    			category: "School",
    			content: "This could be an intro to svelt,so you need to keep calm and see the magic"
    		}
    	];

    	let data = {
    		title: "",
    		category: "",
    		content: "",
    		id: null
    	};

    	let addNote = () => {
    		const newNote = {
    			id: notes.length + 1,
    			title: data.title,
    			category: data.category,
    			content: data.content
    		};

    		$$invalidate(0, notes = notes.concat(newNote));

    		$$invalidate(1, data = {
    			id: null,
    			title: "",
    			category: "",
    			content: ""
    		});

    		console.log(notes);
    	};

    	let isEdit = false;

    	let editNote = note => {
    		$$invalidate(2, isEdit = true);
    		$$invalidate(1, data = note);
    	};

    	let updateNote = () => {
    		$$invalidate(2, isEdit = !isEdit);

    		let noteDB = {
    			title: data.title,
    			category: data.category,
    			content: data.content,
    			id: data.id
    		};

    		let objIndex = notes.findIndex(obj => obj.id == noteDB.id);
    		console.log("Before update: ", notes[objIndex]);
    		$$invalidate(0, notes[objIndex] = noteDB, notes);

    		$$invalidate(1, data = {
    			id: null,
    			title: "",
    			category: "",
    			content: ""
    		});
    	};

    	let deleteNote = id => {
    		console.log(id);
    		$$invalidate(0, notes = notes.filter(note => note.id !== id));
    	};

    	function input_input_handler() {
    		data.title = this.value;
    		$$invalidate(1, data);
    	}

    	function select_change_handler() {
    		data.category = select_value(this);
    		$$invalidate(1, data);
    	}

    	function textarea_input_handler() {
    		data.content = this.value;
    		$$invalidate(1, data);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("notes" in $$props) $$invalidate(0, notes = $$props.notes);
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    		if ("addNote" in $$props) $$invalidate(3, addNote = $$props.addNote);
    		if ("isEdit" in $$props) $$invalidate(2, isEdit = $$props.isEdit);
    		if ("editNote" in $$props) $$invalidate(4, editNote = $$props.editNote);
    		if ("updateNote" in $$props) $$invalidate(5, updateNote = $$props.updateNote);
    		if ("deleteNote" in $$props) $$invalidate(6, deleteNote = $$props.deleteNote);
    	};

    	return [
    		notes,
    		data,
    		isEdit,
    		addNote,
    		editNote,
    		updateNote,
    		deleteNote,
    		input_input_handler,
    		select_change_handler,
    		textarea_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
