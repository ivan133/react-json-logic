/**
 * Any Field
 *
 * This field is like a blueprint for whole structure. It's used for recursive rendering of
 * nested JSON Logic expression. Has a dropdown for selecting the type of children fields and
 * contains its children fields as child components.
 *
 * - onChange: Returns the latest part of the expression rendered by this component. Used by its
 * parent (and grand parents) to complete structure, part by part.
 *
 * - parent: Parent field, used for the selection of available operators (see src/options.js for
 * more detailed explanation) and extracting its children's value recursively.
 *
 * - value: Value of the field, passed from its parent.
 *
 * - data: Data available for accessor fields, gained from the parrent and will be passed to the
 * children fields.
 */

// Core
import React, { PropTypes, Component } from 'react';

// Helpers
import isEqual from 'lodash.isequal';

// UI
import SelectOperator from '../SelectOperator';

// Constants
import { FIELD_TYPES, OPERATORS } from '../../options';

// PropTypes
const { string, any, object, func } = PropTypes;
const propTypes = {
  onChange: func,
  parent: string,
  value: any,
  data: object,
};

const defaultProps = {
  value: {},
};

class Any extends Component {
  constructor() {
    super();
    this.state = { selectedOperator: null, fields: [] };
  }

  componentDidMount() {
    this.onInitializeState(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (!isEqual(this.props.value, nextProps.value)) {
      this.onInitializeState(nextProps);
    }
  }

  /**
   * Initializes component state with respect to props.
   *
   * This method will be called on initial render (from constructor) and cases like async loading,
   * which may end up with change in props.
   */
  onInitializeState = (props) => {
    const value = props.value;
    let field = 'value';
    let selectedOperator = null;
    let fields = [];

    if (typeof value === 'object' && Object.keys(value).length > 0) {
      const firstElem = Object.keys(value)[0];
      field = OPERATORS.some(operator => operator.signature === firstElem) ? firstElem : 'value';
    } else if (typeof value === 'object') {
      field = '';
    }

    selectedOperator = OPERATORS.find(operator => operator.signature === field);

    if (selectedOperator) {
      fields = selectedOperator.fields;
    }

    this.setState({ field, value, selectedOperator, fields });
  }

  /**
   * Resets the content and type of its children.
   */
  onFieldChange = (field) => {
    const selectedOperator = OPERATORS.find(operator => operator.signature === field);
    let value = {};

    if (field === 'value') {
      value = '';
    } else {
      value[field] = [];
    }

    this.setState({
      field,
      value,
      selectedOperator,
      fields: selectedOperator.fields,
    }, () => this.props.onChange(value));
  };

  /**
   * Updates its own state and emits changes to the parrent.
   */
  onChildValueChange = (childValue, index) => {
    const field = this.state.field;
    let value = this.state.value;

    if (field === 'value') {
      value = childValue;
    } else {
      value[field][index] = childValue;
    }

    this.setState({ value }, () => this.props.onChange(value));
  }

  /**
   * Used for selection of available child components.
   * Removes accessor field from the list if props.data is empty
   * Return value of this method will be the entry point of Select component.
   */
  getAvailableOperators = () => {
    const { parent, data } = this.props;

    let operators = OPERATORS.filter(operator =>
      !operator.notAvailableUnder.some(item => item === parent),
    );

    if (Object.keys(data).length === 0) {
      operators = operators.filter(operator => operator.signature !== 'var');
    }

    return operators;
  }

  addField = () => {
    this.setState({ fields: [...this.state.fields, FIELD_TYPES.ANY] });
  }

  removeField = (index) => {
    const { value, field, fields } = this.state;

    fields.splice(index, 1);
    value[field].splice(index, 1);

    this.setState({ fields, value }, () => this.props.onChange(value));
  }

  /**
   * Renders child component by checking its type, initial value.
   * Also passes onChange action and data (which will be consumed by Accessor field) to the child.
   */
  renderChild = (childField, index) => {
    const { field, value, selectedOperator, fields } = this.state;
    const parent = field;
    const parentValue = value;
    const isRemovable = fields.length > selectedOperator.fieldCount.min;

    let childValue = '';

    if (parent !== 'value') {
      childValue = parentValue[parent][index];
    } else {
      childValue = parentValue;
    }

    const ChildComponent = childField.default;

    return (
      <div style={{ position: 'relative' }}>
        {isRemovable &&
          <button
            style={{ position: 'absolute', left: -20 }}
            onClick={() => this.removeField(index)}
          >
            x
          </button>
        }

        <ChildComponent
          key={`${parent}.${index}`}
          parent={parent}
          value={childValue}
          onChange={val => this.onChildValueChange(val, index)}
          data={this.props.data}
        />
      </div>
    );
  }

  render() {
    const { field, fields, selectedOperator } = this.state;
    let canAddMoreChildren = false;

    if (selectedOperator) {
      canAddMoreChildren = fields.length < selectedOperator.fieldCount.max;
    }

    return (
      <div>
        <SelectOperator
          value={field}
          options={this.getAvailableOperators()}
          onChange={this.onFieldChange}
        />

        {canAddMoreChildren &&
          <button onClick={() => this.addField()}>
            +
          </button>
        }

        {selectedOperator &&
          <div style={{ marginLeft: 20, marginTop: 5, marginBottom: 5 }}>
            {fields.map(this.renderChild)}
          </div>
        }
      </div>
    );
  }
}

Any.propTypes = propTypes;
Any.defaultProps = defaultProps;

export default Any;
