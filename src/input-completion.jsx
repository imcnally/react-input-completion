import React, { Children, cloneElement, Component, findDOMNode, PropTypes } from 'react'

const keys = {
  down : 'ArrowDown',
  enter : 'Enter',
  up : 'ArrowUp'
}

export default class InputCompletion extends Component {

  constructor (props) {
    super(props)

    this.state = {
      inputWidth : null, // fallback only
      selectedSuggestion : 0, // fallback only
      showSuggestions : false, // fallback only
      shownOptions : [], // fallback only
      value : ''
    }
  }

  componentDidMount () {
    const { useNative } = this.props

    const newState = {
      nativeSupport : (!useNative) ? false : this._supportsNative()
    }

    if (!newState.nativeSupport) {
      const offsetWidth = findDOMNode(this.refs.input).offsetWidth
      newState.inputWidth = `${offsetWidth}px`
    }

    this.setState(newState)
  }

  componentWillReceiveProps (nextProps) {
    this.setState({
      shownOptions : this._getOptionsToShow(this.state.value, nextProps.options)
    })
  }

  _supportsNative () {
    const feature = document.createElement('datalist')
    return Boolean(feature && feature.options)
  }

  _getFallbackContainerStyles () {
    return {
      display : (this.state.showSuggestions && this.state.value) ? 'block' : 'none',
      width : this.state.inputWidth
    }
  }

  _renderFallbackOptions () {
    const options = this.state.shownOptions.map((option, index) => {
      const isSelected = index === this.state.selectedSuggestion
      const onMouseDown = this.onFallbackOptionClick.bind(this, option)

      return (
        <li aria-selected={isSelected} className='ric-fb-option' key={index} onMouseDown={onMouseDown} role='option'>
          {option}
        </li>
      )
    })

    return (
      <ul aria-multiselectable='false' className='ric-fb-options' role='listbox'
        style={this._getFallbackContainerStyles()}>
        {options}
      </ul>
    )
  }

  _renderOptions () {
    if (!this.state.nativeSupport) {
      return this._renderFallbackOptions()
    }

    const options = this.props.options.map((option, index) => {
      return <option key={index} value={option} />
    })

    return (
      <datalist id={this.props.name}>
        {options}
      </datalist>
    )
  }

  _renderChildren () {
    const child = Children.only(this.props.children)
    const props = {
      list : this.props.name,
      onBlur : this.onBlur.bind(this),
      onChange : this.onChange.bind(this),
      ref : 'input',
      value : this.state.value
    }

    if (!this.state.nativeSupport) {
      props.onKeyDown = this.onKeyDown.bind(this)
    }

    return cloneElement(child, props)
  }

  _isOptionShown (input, option) {
    const optionRegex = new RegExp(input, 'gi')

    return input && option.match(optionRegex)
  }

  _getOptionsToShow (value, options) {
    return options.filter((option) => this._isOptionShown(value, option))
  }

  onKeyDown (event) {
    const { key } = event
    const { selectedSuggestion, shownOptions } = this.state
    let nextIndex = selectedSuggestion

    switch (key) {
    case keys.down:
      const maxIndex = shownOptions.length - 1
      nextIndex = (selectedSuggestion === maxIndex) ? maxIndex : selectedSuggestion + 1
      break
    case keys.up:
      nextIndex = (selectedSuggestion <= 0) ? 0 : selectedSuggestion - 1
      break
    case keys.enter:
      this.onFallbackOptionClick(shownOptions[selectedSuggestion])
      break
    default:
      return
    }

    this.setState({ selectedSuggestion : nextIndex })

  }

  onFallbackOptionClick (option) {
    this.setState({ showSuggestions : false, value : option })
  }

  onBlur () {
    this.setState({ showSuggestions : false })
  }

  onChange (event) {
    const { value } = event.target
    const newState = { value }

    if (!this.state.nativeSupport) {
      newState.selectedSuggestion = 0
      newState.showSuggestions = true
      newState.shownOptions = this._getOptionsToShow(value, this.props.options)
    }

    this.setState(newState)

    if (this.props.onValueChange) {
      this.props.onValueChange(event, value)
    }
  }

  render () {
    return (
      <section>
        {this._renderChildren()}
        {this._renderOptions()}
      </section>
    )
  }

}

InputCompletion.defaultProps = {
  useNative : true
}

InputCompletion.propTypes = {
  children : PropTypes.element.isRequired,
  name : PropTypes.string.isRequired,
  onValueChange : PropTypes.func,
  options : PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  useNative : PropTypes.bool
}
