import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { LLMSelectDrawerButton } from '@/components/LLMSelect';
import {
  DEFAULT_LLM_MODEL,
  DEFAULT_LLM_PROVIDER,
  useLLMStore,
  type LLMModel,
  type LLMProvider,
} from '@/stores/llm';

const setSelection = (provider: LLMProvider, model: LLMModel) => {
  useLLMStore.setState({ llmProvider: provider, llmModel: model });
};

describe('LLMSelectDrawerButton', () => {
  beforeEach(() => {
    setSelection(DEFAULT_LLM_PROVIDER, DEFAULT_LLM_MODEL);
  });

  it('updates the selected model from the drawer', async () => {
    const user = userEvent.setup();
    render(<LLMSelectDrawerButton />);

    await user.click(screen.getByLabelText('Select AI model'));
    await user.click(screen.getByTestId('llm-option-openai:gpt-4.1-mini'));

    expect(useLLMStore.getState().llmProvider).toBe('openai');
    expect(useLLMStore.getState().llmModel).toBe('gpt-4.1-mini');
  });
});
