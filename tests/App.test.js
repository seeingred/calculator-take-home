import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../src/App.vue'

async function run(wrapper, first, op, second) {
  await wrapper.find('#first').setValue(first)
  await wrapper.find('#second').setValue(second)
  await wrapper.find('#operation').setValue(op)
  await wrapper.find('#calculate').trigger('click')
  return wrapper.find('#result').text()
}

describe('App', () => {
  it('renders the required form elements', () => {
    const wrapper = mount(App, { attachTo: document.body })

    for (const id of ['first', 'second']) {
      const input = wrapper.find(`#${id}`)
      expect(input.element.tagName).toBe('INPUT')
      expect(input.attributes('type')).toBe('number')
      expect(input.attributes('step')).toBe('any')
    }

    const select = wrapper.find('select#operation')
    expect(select.exists()).toBe(true)
    const options = select.findAll('option').map((o) => [o.element.value, o.text()])
    expect(options).toEqual([
      ['+', '+'],
      ['-', '-'],
      ['%', '%'],
      ['*', '*'],
    ])

    expect(wrapper.find('button#calculate').exists()).toBe(true)
    expect(wrapper.find('#result').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows the result only after clicking the button', async () => {
    const wrapper = mount(App, { attachTo: document.body })
    await wrapper.find('#first').setValue('0.1')
    await wrapper.find('#second').setValue('0.2')
    expect(wrapper.find('#result').text()).toBe('')
    await wrapper.find('#calculate').trigger('click')
    expect(wrapper.find('#result').text()).toBe('0.3')
    wrapper.unmount()
  })

  it.each([
    ['0.1', '+', '0.2', '0.3'],
    ['10', '-', '12.5', '-2.5'],
    ['-7', '%', '3', '-1'],
    ['1.234', '*', '5.678', '7.01'],
  ])('%s %s %s = %s', async (a, op, b, expected) => {
    const wrapper = mount(App, { attachTo: document.body })
    expect(await run(wrapper, a, op, b)).toBe(expected)
    wrapper.unmount()
  })

  it('does not submit the form (no navigation or reload)', async () => {
    const wrapper = mount(App, { attachTo: document.body })
    const event = new Event('submit', { cancelable: true })
    wrapper.find('form').element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    wrapper.unmount()
  })

  it('shows an error instead of a result for remainder by zero', async () => {
    const wrapper = mount(App, { attachTo: document.body })
    expect(await run(wrapper, '5', '%', '0')).toBe('')
    expect(wrapper.find('[role="alert"]').text()).toMatch(/zero/)
    wrapper.unmount()
  })
})
