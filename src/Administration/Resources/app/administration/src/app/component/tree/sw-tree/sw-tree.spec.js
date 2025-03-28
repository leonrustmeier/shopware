/**
 * @package admin
 */

import { createLocalVue, shallowMount } from '@vue/test-utils';
import 'src/app/component/tree/sw-tree';
import 'src/app/component/tree/sw-tree-item';
import 'src/app/component/utils/sw-vnode-renderer';
import 'src/app/component/form/sw-field';
import 'src/app/component/form/sw-text-field';
import 'src/app/component/form/field-base/sw-contextual-field';
import 'src/app/component/form/field-base/sw-block-field';
import 'src/app/component/form/field-base/sw-base-field';
import 'src/app/component/form/sw-checkbox-field';
import getTreeItems from './fixtures/treeItems';

async function createWrapper() {
    const localVue = createLocalVue();
    localVue.directive('tooltip', {});
    localVue.directive('droppable', {});
    localVue.directive('draggable', {});

    return shallowMount(await Shopware.Component.build('sw-tree'), {
        localVue,
        stubs: {
            'sw-field': await Shopware.Component.build('sw-field'),
            'sw-contextual-field': await Shopware.Component.build('sw-contextual-field'),
            'sw-block-field': await Shopware.Component.build('sw-block-field'),
            'sw-base-field': await Shopware.Component.build('sw-base-field'),
            'sw-checkbox-field': await Shopware.Component.build('sw-checkbox-field'),
            'sw-text-field': await Shopware.Component.build('sw-text-field'),
            'sw-field-error': true,
            'sw-tree-input-field': true,
            'sw-button': true,
            'sw-context-menu-item': true,
            'sw-context-button': true,
            'sw-vnode-renderer': await Shopware.Component.build('sw-vnode-renderer'),
            'sw-icon': true,
            'sw-tree-item': await Shopware.Component.build('sw-tree-item'),
        },
        mocks: {
            $route: {
                params: [
                    { id: null },
                ],
            },
        },
        provide: {
            validationService: {},
        },
        propsData: {
            items: getTreeItems(),
        },
        attachTo: document.body,
    });
}

describe('src/app/component/tree/sw-tree', () => {
    /** @type Wrapper */
    let wrapper;

    beforeEach(async () => {
        wrapper = await createWrapper();
    });

    afterEach(() => {
        if (wrapper) wrapper.destroy();
    });

    it('should be a Vue.js component', async () => {
        expect(wrapper.vm).toBeTruthy();
    });

    it('should render tree correctly with only the main item', async () => {
        const treeItems = wrapper.findAll('.sw-tree-item');
        expect(treeItems).toHaveLength(1);

        // parent should be closed
        expect(treeItems.at(0).classes()).not.toContain('is--opened');

        // parent should contain correct name
        expect(treeItems.at(0).find('.sw-tree-item__element').text()).toContain('Home');
    });

    it('should render tree correctly when user open the main item', async () => {
        await wrapper.find('.sw-tree-item .sw-tree-item__toggle').trigger('click');

        // parent should be open
        const openedParent = wrapper.find('.sw-tree-item.is--opened');
        expect(openedParent.isVisible()).toBe(true);

        // parent should contain correct name
        expect(openedParent.find('.sw-tree-item__element').text()).toContain('Home');

        // two children should be visible
        const childrenItems = openedParent.find('.sw-tree-item__children').findAll('.sw-tree-item');
        expect(childrenItems).toHaveLength(2);

        // first child should contain correct names
        expect(childrenItems.at(0).text()).toContain('Health & Games');
        expect(childrenItems.at(1).text()).toContain('Shoes');
    });

    it('should render tree correctly when user open the main item and children group', async () => {
        await wrapper.find('.sw-tree-item .sw-tree-item__toggle').trigger('click');

        const openedParent = wrapper.find('.sw-tree-item.is--opened');
        const childrenItems = openedParent.find('.sw-tree-item__children').findAll('.sw-tree-item');

        // open first child of parent
        await childrenItems.at(0).find('.sw-tree-item__toggle').trigger('click');

        // check if all folders and items are correctly opened
        expect(childrenItems.at(0).text()).toContain('Health & Games');
        expect(childrenItems.at(1).text()).toContain('Shoes');

        const healtGamesFolder = childrenItems.at(0);
        const childrenOfHealthGames = healtGamesFolder.find('.sw-tree-item__children').findAll('.sw-tree-item');

        // check if children have correct class
        const childrenOfHealthGamesNames = [
            'Electronics & Games',
            'Clothing & Grocery',
            'Baby, Health & Garden',
            'Automotive',
            'Toys, Health & Music',
        ];

        childrenOfHealthGames.wrappers.forEach((item, index) => {
            expect(item.classes()).toContain('is--no-children');
            expect(item.text()).toContain(childrenOfHealthGamesNames[index]);
        });
    });

    it('should select Automotive and the checkboxes are ticked correctly', async () => {
        await wrapper.find('.sw-tree-item .sw-tree-item__toggle').trigger('click');

        const openedParent = wrapper.find('.sw-tree-item.is--opened');
        const childrenItems = openedParent.find('.sw-tree-item__children').findAll('.sw-tree-item');

        // open first child of parent
        const healthGamesFolder = childrenItems.at(0);
        await healthGamesFolder.find('.sw-tree-item__toggle').trigger('click');

        // find "Automotive" item
        const automotiveItem = healthGamesFolder
            .find('.sw-tree-item__children')
            .findAll('.sw-tree-item')
            .at(3);

        expect(automotiveItem.text()).toContain('Automotive');

        // check checkbox of automotive
        const automotiveCheckbox = automotiveItem.find('.sw-field--checkbox');
        expect(automotiveCheckbox.props('value')).toBe(false);
        await automotiveCheckbox.find('input').trigger('click');
        expect(automotiveCheckbox.props('value')).toBe(true);

        // check if parents contains ghost checkbox
        const healthGamesFolderCheckbox = healthGamesFolder.find('.sw-tree-item__selection .sw-field--checkbox');
        expect(healthGamesFolderCheckbox.classes()).toContain('sw-field__checkbox--ghost');

        const openedParentCheckbox = openedParent.find('.sw-tree-item__selection .sw-field--checkbox');
        expect(openedParentCheckbox.classes()).toContain('sw-field__checkbox--ghost');
    });

    it('should show the delete button', async () => {
        expect(wrapper.find('.sw-tree-actions__delete_categories').exists()).toBeFalsy();

        await wrapper.setData({
            checkedElementsCount: 2,
        });

        expect(wrapper.find('.sw-tree-actions__delete_categories').exists()).toBeTruthy();
    });

    it('should allow to delete the items', async () => {
        expect(wrapper.find('.sw-tree-actions__delete_categories').exists()).toBeFalsy();

        await wrapper.setData({
            checkedElementsCount: 2,
        });

        expect(wrapper.find('.sw-tree-actions__delete_categories').attributes().disabled).toBeUndefined();
    });

    it('should not allow to delete the items', async () => {
        expect(wrapper.find('.sw-tree-actions__delete_categories').exists()).toBeFalsy();

        await wrapper.setProps({
            allowDeleteCategories: false,
        });

        await wrapper.setData({
            checkedElementsCount: 2,
        });

        expect(wrapper.find('.sw-tree-actions__delete_categories').attributes().disabled).toBeDefined();
    });

    it('should adjust the children count correctly, when moving elements out of a folder', async () => {
        const treeItems = wrapper.props('items');

        const rootCategoryId = 'a1d1da1e6d434902a2e5ffed7784c951';
        const testCategoryIds = ['d3aabfa637cf435e8ad3c9bf1d2de565', '8da86665f27740dd8160c92e27b1c4c8'];
        const rootCategory = treeItems.find(element => element.id === rootCategoryId);
        const testCategories = testCategoryIds.map((id) => {
            return treeItems.find(element => element.id === id);
        });
        let expectedRootChildCount = 2;

        expect(rootCategory.childCount).toBe(rootCategory.data.childCount);
        expect(rootCategory.childCount).toBe(expectedRootChildCount);
        expect(rootCategory.parentId).toBeNull();

        testCategories.forEach((category) => {
            expect(category.childCount).toBe(category.data.childCount);
            expect(category.parentId).toBe(rootCategoryId);

            // Move the child outside and above its former parent
            wrapper.vm.startDrag({ item: category });
            wrapper.vm.moveDrag(category, rootCategory);
            wrapper.vm.endDrag();

            expectedRootChildCount -= 1;

            expect(category.childCount).toBe(category.data.childCount);
            expect(rootCategory.childCount).toBe(expectedRootChildCount);

            expect(category.parentId).toBeNull();
            expect(rootCategory.parentId).toBeNull();
        });
    });
});
